import { localDB } from "../db/localDB";

class OfflineEntityWrapper {
  constructor(apiEntity, storeName) {
    this.apiEntity = apiEntity;
    this.storeName = storeName;
  }

  async list(sortBy = "-created_date") {
    if (navigator.onLine) {
      try {
        const data = await this.apiEntity.list(sortBy);
        if (data) {
          await this.cacheMultiple(data);
          return data;
        }
      } catch (error) {
        console.error(`[${this.storeName}] 온라인 list 실패, 로컬 데이터 사용:`, error);
      }
    }
    
    // 오프라인이거나 API 실패 시 로컬 데이터 반환
    return this.getLocalList();
  }

  async get(id) {
    if (navigator.onLine) {
      try {
        const data = await this.apiEntity.get(id);
        if (data) {
          await this.cacheSingle(data);
          return data;
        }
      } catch (error) {
        console.error(`[${this.storeName}] 온라인 get 실패, 로컬 데이터 사용:`, error);
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
        console.error(`[${this.storeName}] ❌ 서버 저장 실패, 큐에 추가:`, error);
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
        console.error(`[${this.storeName}] ❌ 서버 업데이트 실패, 큐에 추가:`, error);
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
    await localDB.put(this.storeName, { id, sync_status: "pending_delete" });
    if (navigator.onLine) {
      try {
        await this.apiEntity.delete(id);
        await localDB.delete(this.storeName, id);
        return { success: true };
      } catch (error) {
        console.warn(`[${this.storeName}] Delete queued:`, error);
        await this.addToSyncQueue("delete", { id });
      }
    } else {
      await this.addToSyncQueue("delete", { id });
    }
    return { success: true };
  }

  async cacheSingle(data) {
    if (data?.id)
      await localDB.put(this.storeName, { ...data, sync_status: "synced" });
  }

  async cacheMultiple(dataArray) {
    if (Array.isArray(dataArray)) {
      for (const item of dataArray) await this.cacheSingle(item);
    }
  }

  async getLocalList() {
    const all = await localDB.getAll(this.storeName);
    return all.filter((i) => i.sync_status !== "pending_delete");
  }

  async addToSyncQueue(action, data) {
    await localDB.addToSyncQueue({
      action,
      storeName: this.storeName,
      data,
      timestamp: Date.now(),
    });
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
