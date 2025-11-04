import { localDB } from "../db/localDB";

class OfflineEntityWrapper {
  constructor(apiEntity, storeName) {
    this.apiEntity = apiEntity;
    this.storeName = storeName;
  }

  async list(sortBy = "-created_date") {
    try {
      if (navigator.onLine) {
        const data = await this.apiEntity.list(sortBy);
        await this.cacheMultiple(data);
        return data;
      }
    } catch (error) {
      console.warn(`[${this.storeName}] API list failed:`, error);
    }
    return this.getLocalList();
  }

  async get(id) {
    try {
      if (navigator.onLine) {
        const data = await this.apiEntity.get(id);
        await this.cacheSingle(data);
        return data;
      }
    } catch (error) {
      console.warn(`[${this.storeName}] API get failed:`, error);
    }
    return localDB.get(this.storeName, id);
  }

  async create(data) {
    const localData = {
      ...data,
      id: data.id || crypto.randomUUID(),
      created_date: data.created_date || new Date().toISOString(),
      sync_status: "pending",
    };

    if (navigator.onLine) {
      try {
        // ID를 포함한 전체 데이터를 서버에 전송
        const serverData = await this.apiEntity.create(localData);
        await this.cacheSingle({ ...serverData, sync_status: "synced" });
        return serverData;
      } catch (error) {
        console.warn(`[${this.storeName}] Create queued:`, error);
        await localDB.put(this.storeName, localData);
        await this.addToSyncQueue("create", localData);
        return localData;
      }
    } else {
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

    if (navigator.onLine) {
      try {
        const serverData = await this.apiEntity.update(id, data);
        await this.cacheSingle({ ...serverData, sync_status: "synced" });
        return serverData;
      } catch (error) {
        console.warn(`[${this.storeName}] Update queued:`, error);
        await localDB.put(this.storeName, localData);
        await this.addToSyncQueue("update", localData);
        return localData;
      }
    } else {
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
