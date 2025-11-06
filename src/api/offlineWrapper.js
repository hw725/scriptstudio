import { localDB } from "../db/localDB";

class OfflineEntityWrapper {
  constructor(apiEntity, storeName) {
    this.apiEntity = apiEntity;
    this.storeName = storeName;
    // 최근 삭제된 항목 ID를 임시 저장 (5초간 유지)
    this.recentlyDeleted = new Map();
  }

  async list(sortBy = "-created_date") {
    if (navigator.onLine) {
      try {
        // 1) 로컬 데이터 먼저 가져오기 (즉시 표시용)
        const localAll = await localDB.getAll(this.storeName);

        // 2) 서버 데이터 가져오기 및 캐시 (백그라운드)
        const serverData = await this.apiEntity.list(sortBy);
        const safeServer = Array.isArray(serverData) ? serverData : [];
        await this.cacheMultiple(safeServer);

        // 3) 로컬과 서버 데이터 병합
        const byId = new Map(safeServer.map((i) => [i.id, i]));

        for (const local of localAll) {
          const existing = byId.get(local.id) || {};
          const serverTime =
            existing?.updated_date || existing?.updated_at || 0;
          const localTime = local.updated_date || local.updated_at || 0;

          // 로컬에만 있거나, 로컬이 더 최신이면 로컬 데이터 사용
          if (!existing.id || new Date(localTime) >= new Date(serverTime)) {
            byId.set(local.id, { ...existing, ...local });
          }
        }

        // 최근 삭제된 항목 필터링
        const result = Array.from(byId.values()).filter(
          (item) => !this.recentlyDeleted.has(item.id)
        );

        return result;
      } catch (error) {
        console.error(
          `[${this.storeName}] 온라인 list 실패, 로컬 데이터 사용:`,
          error
        );
      }
    }

    // 오프라인이거나 API 실패 시 로컬 데이터 반환
    return this.getLocalList();
  }

  async get(id) {
    if (navigator.onLine) {
      try {
        const server = await this.apiEntity.get(id);
        const local = await localDB.get(this.storeName, id);

        // 둘 다 있으면 최신 것을 선택
        if (server && local) {
          await this.cacheSingle(server);
          const serverTime = server.updated_date || server.updated_at || 0;
          const localTime = local.updated_date || local.updated_at || 0;
          return new Date(localTime) > new Date(serverTime) ? local : server;
        }

        if (server) {
          await this.cacheSingle(server);
          return server;
        }

        if (local) return local;

        return null;
      } catch (error) {
        console.error(
          `[${this.storeName}] 온라인 get 실패, 로컬 데이터 사용:`,
          error
        );
      }
    }

    // 오프라인이거나 API 실패 시 로컬 데이터 반환
    return localDB.get(this.storeName, id);
  }

  async create(data) {
    const localData = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_date: data.created_date || new Date().toISOString(),
      updated_date: data.updated_date || new Date().toISOString(),
      sync_status: "pending",
    };

    // 온라인이면 서버에 바로 저장 시도
    if (navigator.onLine) {
      try {
        console.log(`[${this.storeName}] 서버에 create 요청:`, localData.id);
        const serverData = await this.apiEntity.create(localData);

        // 서버 저장 성공 시 로컬에도 synced 상태로 캐싱
        const syncedData = { ...serverData, sync_status: "synced" };
        await localDB.put(this.storeName, syncedData);

        console.log(`[${this.storeName}] ✅ 서버 저장 성공:`, serverData.id);
        return serverData;
      } catch (error) {
        console.error(
          `[${this.storeName}] ❌ 서버 저장 실패, 큐에 추가:`,
          error
        );
        // 서버 저장 실패 시 로컬에 pending으로 저장하고 큐에 추가
        await localDB.put(this.storeName, localData);
        await this.addToSyncQueue("create", localData);
        return localData;
      }
    } else {
      // 오프라인이면 로컬에 저장하고 큐에 추가
      console.log(`[${this.storeName}] 오프라인 - 큐에 추가:`, localData.id);
      await localDB.put(this.storeName, localData);
      await this.addToSyncQueue("create", localData);
      return localData;
    }
  }

  async update(id, data) {
    const localData = {
      ...data,
      id,
      updated_date: new Date().toISOString(),
      sync_status: "pending",
    };

    // 온라인이면 서버에 바로 업데이트 시도
    if (navigator.onLine) {
      try {
        console.log(`[${this.storeName}] 서버에 update 요청:`, id);
        const serverData = await this.apiEntity.update(id, data);

        // 서버 업데이트 성공 시 로컬에도 synced 상태로 캐싱
        const syncedData = { ...serverData, sync_status: "synced" };
        await localDB.put(this.storeName, syncedData);

        console.log(`[${this.storeName}] ✅ 서버 업데이트 성공:`, id);
        return serverData;
      } catch (error) {
        console.error(
          `[${this.storeName}] ❌ 서버 업데이트 실패, 큐에 추가:`,
          error
        );
        // 서버 업데이트 실패 시 로컬에 pending으로 저장하고 큐에 추가
        await localDB.put(this.storeName, localData);
        await this.addToSyncQueue("update", localData);
        return localData;
      }
    } else {
      // 오프라인이면 로컬에 저장하고 큐에 추가
      console.log(`[${this.storeName}] 오프라인 - 큐에 추가:`, id);
      await localDB.put(this.storeName, localData);
      await this.addToSyncQueue("update", localData);
      return localData;
    }
  }

  async delete(id) {
    // 삭제된 항목을 최근 삭제 목록에 추가 (5초간 유지)
    this.markAsRecentlyDeleted(id);

    // 온라인이면 서버에서 바로 삭제 시도
    if (navigator.onLine) {
      try {
        console.log(`[${this.storeName}] 서버에 delete 요청:`, id);
        await this.apiEntity.delete(id);

        // 서버 삭제 성공 시 로컬 캐시에서도 CASCADE 삭제
        await this.deleteLocalCascade(id);

        console.log(`[${this.storeName}] ✅ 서버 삭제 성공:`, id);
        return { success: true };
      } catch (error) {
        console.error(
          `[${this.storeName}] ❌ 서버 삭제 실패, 큐에 추가:`,
          error
        );
        // 서버 삭제 실패 시 pending_delete로 표시하고 큐에 추가
        await localDB.put(this.storeName, {
          id,
          sync_status: "pending_delete",
        });
        await this.addToSyncQueue("delete", { id });
        return { success: true };
      }
    } else {
      // 오프라인이면 pending_delete로 표시하고 큐에 추가
      console.log(`[${this.storeName}] 오프라인 - 삭제 큐에 추가:`, id);
      await localDB.put(this.storeName, { id, sync_status: "pending_delete" });
      await this.addToSyncQueue("delete", { id });
      return { success: true };
    }
  }

  async deleteLocalCascade(id) {
    const deletedIds = []; // CASCADE로 삭제되는 모든 ID 추적

    // 프로젝트 삭제 시 관련 데이터도 로컬 캐시에서 삭제
    if (this.storeName === "projects") {
      const folders = await localDB.getAll("folders");
      const notes = await localDB.getAll("notes");
      const references = await localDB.getAll("references");
      const settings = await localDB.getAll("project_settings");

      // 프로젝트 삭제
      await localDB.delete(this.storeName, id);

      // 관련 폴더 찾기 및 삭제
      const projectFolders = folders.filter((f) => f.project_id === id);
      for (const folder of projectFolders) {
        await localDB.delete("folders", folder.id);
        deletedIds.push(folder.id);

        // 하위 폴더 재귀 삭제
        const childIds = await this.deleteChildFoldersFromCache(
          folder.id,
          folders
        );
        deletedIds.push(...childIds);
      }

      // 프로젝트의 모든 노트 삭제
      for (const note of notes) {
        if (note.project_id === id) {
          await localDB.delete("notes", note.id);
          deletedIds.push(note.id);
        }
      }

      // 프로젝트의 모든 참고문헌 삭제
      for (const ref of references) {
        if (ref.project_id === id) {
          await localDB.delete("references", ref.id);
          deletedIds.push(ref.id);
        }
      }

      // 프로젝트 설정 삭제
      for (const setting of settings) {
        if (setting.project_id === id) {
          await localDB.delete("project_settings", setting.id);
          deletedIds.push(setting.id);
        }
      }

      // 삭제된 모든 항목을 최근 삭제 목록에 추가
      this.markCascadeDeleted(deletedIds);
    }
    // 폴더 삭제 시 하위 폴더와 노트도 로컬 캐시에서 삭제
    else if (this.storeName === "folders") {
      const deletedIds = [];
      const folders = await localDB.getAll("folders");
      const notes = await localDB.getAll("notes");

      // 폴더 삭제
      await localDB.delete(this.storeName, id);

      // 하위 폴더 재귀 삭제
      const childIds = await this.deleteChildFoldersFromCache(id, folders);
      deletedIds.push(...childIds);

      // 폴더의 모든 노트 삭제
      for (const note of notes) {
        if (note.folder_id === id) {
          await localDB.delete("notes", note.id);
          deletedIds.push(note.id);
        }
      }

      // 삭제된 모든 항목을 최근 삭제 목록에 추가
      this.markCascadeDeleted(deletedIds);
    }
    // 기타 엔티티는 단순 삭제
    else {
      await localDB.delete(this.storeName, id);
    }
  }

  async deleteChildFoldersFromCache(parentId, allFolders) {
    const deletedIds = [];
    const children = allFolders.filter((f) => f.parent_id === parentId);
    for (const child of children) {
      await localDB.delete("folders", child.id);
      deletedIds.push(child.id);

      const childChildIds = await this.deleteChildFoldersFromCache(
        child.id,
        allFolders
      );
      deletedIds.push(...childChildIds);
    }
    return deletedIds;
  }

  async cacheSingle(data) {
    if (data?.id) {
      // 로컬에 이미 pending_delete 상태인 항목은 캐싱하지 않음
      const existing = await localDB.get(this.storeName, data.id);
      if (existing?.sync_status === "pending_delete") {
        console.log(
          `[${this.storeName}] ⏭️ pending_delete 항목 캐싱 건너뜀:`,
          data.id
        );
        return;
      }

      await localDB.put(this.storeName, { ...data, sync_status: "synced" });
    }
  }

  async cacheMultiple(dataArray) {
    if (Array.isArray(dataArray) && dataArray.length > 0) {
      for (const item of dataArray) {
        await this.cacheSingle(item);
      }
    }
  }

  async getLocalList() {
    const all = await localDB.getAll(this.storeName);
    // pending_delete 상태가 아닌 항목만 반환
    return all.filter((item) => item.sync_status !== "pending_delete");
  }

  async addToSyncQueue(action, data) {
    await localDB.addToSyncQueue({
      action,
      storeName: this.storeName,
      data,
      timestamp: Date.now(),
    });
  }

  markAsRecentlyDeleted(id) {
    this.recentlyDeleted.set(id, Date.now());

    // 5초 후 자동 제거
    setTimeout(() => {
      this.recentlyDeleted.delete(id);
      console.log(`[${this.storeName}] 🧹 최근 삭제 목록에서 제거:`, id);
    }, 5000);
  }

  markCascadeDeleted(ids) {
    for (const id of ids) {
      this.markAsRecentlyDeleted(id);
    }
  }
}

export const createOfflineWrapper = (apiClient) => {
  const wrappedEntities = {};

  // Entity 이름과 테이블명 매칭
  const entityToTable = {
    Note: "notes",
    Folder: "folders",
    Reference: "references",
    Project: "projects",
    Template: "templates",
    ProjectSettings: "project_settings",
    CitationStyle: "citation_styles",
    NoteVersion: "note_versions",
    DailyNote: "daily_notes",
  };

  for (const [entityName, entity] of Object.entries(apiClient.entities)) {
    const storeName = entityToTable[entityName] || entityName.toLowerCase();
    wrappedEntities[entityName] = new OfflineEntityWrapper(entity, storeName);
  }

  return { ...apiClient, entities: wrappedEntities };
};
