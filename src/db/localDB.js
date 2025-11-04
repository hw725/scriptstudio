import { openDB } from "idb";

const DB_NAME = "scriptstudio-offline";
const DB_VERSION = 2; // 버전 업그레이드 (새 스토어 추가)

/**
 * IndexedDB 초기화
 * 노트, 프로젝트, 템플릿, 동기화 큐 등을 저장
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 노트 저장소
      if (!db.objectStoreNames.contains("notes")) {
        const notesStore = db.createObjectStore("notes", { keyPath: "id" });
        notesStore.createIndex("updated_at", "updated_at");
        notesStore.createIndex("sync_status", "sync_status");
        notesStore.createIndex("project_id", "project_id");
      }

      // 프로젝트 저장소
      if (!db.objectStoreNames.contains("projects")) {
        const projectsStore = db.createObjectStore("projects", {
          keyPath: "id",
        });
        projectsStore.createIndex("updated_at", "updated_at");
        projectsStore.createIndex("sync_status", "sync_status");
      }

      // 템플릿 저장소
      if (!db.objectStoreNames.contains("templates")) {
        const templatesStore = db.createObjectStore("templates", {
          keyPath: "id",
        });
        templatesStore.createIndex("updated_at", "updated_at");
        templatesStore.createIndex("sync_status", "sync_status");
      }

      // 참고문헌 저장소
      if (!db.objectStoreNames.contains("references")) {
        const referencesStore = db.createObjectStore("references", {
          keyPath: "id",
        });
        referencesStore.createIndex("updated_at", "updated_at");
        referencesStore.createIndex("sync_status", "sync_status");
      }

      // 폴더 저장소
      if (!db.objectStoreNames.contains("folders")) {
        const foldersStore = db.createObjectStore("folders", {
          keyPath: "id",
        });
        foldersStore.createIndex("updated_at", "updated_at");
        foldersStore.createIndex("sync_status", "sync_status");
        foldersStore.createIndex("project_id", "project_id");
      }

      // 프로젝트 설정 저장소
      if (!db.objectStoreNames.contains("project_settings")) {
        const projectSettingsStore = db.createObjectStore("project_settings", {
          keyPath: "id",
        });
        projectSettingsStore.createIndex("updated_at", "updated_at");
        projectSettingsStore.createIndex("sync_status", "sync_status");
      }

      // 인용 스타일 저장소
      if (!db.objectStoreNames.contains("citation_styles")) {
        const citationStylesStore = db.createObjectStore("citation_styles", {
          keyPath: "id",
        });
        citationStylesStore.createIndex("updated_at", "updated_at");
        citationStylesStore.createIndex("sync_status", "sync_status");
      }

      // 노트 버전 저장소
      if (!db.objectStoreNames.contains("note_versions")) {
        const noteVersionsStore = db.createObjectStore("note_versions", {
          keyPath: "id",
        });
        noteVersionsStore.createIndex("updated_at", "updated_at");
        noteVersionsStore.createIndex("sync_status", "sync_status");
        noteVersionsStore.createIndex("note_id", "note_id");
      }

      // 일일 노트 저장소
      if (!db.objectStoreNames.contains("daily_notes")) {
        const dailyNotesStore = db.createObjectStore("daily_notes", {
          keyPath: "id",
        });
        dailyNotesStore.createIndex("updated_at", "updated_at");
        dailyNotesStore.createIndex("sync_status", "sync_status");
        dailyNotesStore.createIndex("date", "date");
      }

      // 동기화 큐 (오프라인 시 변경사항 대기열)
      if (!db.objectStoreNames.contains("sync_queue")) {
        const syncStore = db.createObjectStore("sync_queue", {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("timestamp", "timestamp");
        syncStore.createIndex("retry_count", "retry_count");
      }

      // 메타데이터 저장소 (마지막 동기화 시간 등)
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    },
  });
};

/**
 * 로컬 데이터베이스 작업을 위한 헬퍼 함수들
 */
export const localDB = {
  /**
   * 단일 항목 조회
   */
  async get(store, id) {
    const db = await initDB();
    return db.get(store, id);
  },

  /**
   * 모든 항목 조회
   */
  async getAll(store) {
    const db = await initDB();
    return db.getAll(store);
  },

  /**
   * 인덱스로 조회
   */
  async getAllByIndex(store, indexName, value) {
    const db = await initDB();
    return db.getAllFromIndex(store, indexName, value);
  },

  /**
   * 항목 저장/업데이트
   */
  async put(store, data) {
    const db = await initDB();
    // 기존 항목이 있으면 병합하여 필드 손실 방지
    let existing = undefined;
    try {
      if (data && data.id) {
        existing = await db.get(store, data.id);
      }
    } catch {
      // ignore read error and proceed with non-merged put
    }

    const merged = {
      ...(existing || {}),
      ...data,
    };

    const itemWithMeta = {
      ...merged,
      updated_at: merged.updated_at || Date.now(),
      sync_status:
        merged.sync_status !== undefined
          ? merged.sync_status
          : existing?.sync_status || "pending",
    };

    await db.put(store, itemWithMeta);
    return itemWithMeta;
  },

  /**
   * 여러 항목 일괄 저장
   */
  async putMany(store, items) {
    const db = await initDB();
    const tx = db.transaction(store, "readwrite");
    const results = [];

    for (const item of items) {
      const itemWithMeta = {
        ...item,
        updated_at: item.updated_at || Date.now(),
        sync_status: item.sync_status || "pending",
      };
      await tx.store.put(itemWithMeta);
      results.push(itemWithMeta);
    }

    await tx.done;
    return results;
  },

  /**
   * 항목 삭제
   */
  async delete(store, id) {
    const db = await initDB();
    return db.delete(store, id);
  },

  /**
   * 모든 항목 삭제
   */
  async clear(store) {
    const db = await initDB();
    return db.clear(store);
  },

  /**
   * 동기화 큐에 작업 추가
   */
  async addToSyncQueue(action) {
    const db = await initDB();
    return db.add("sync_queue", {
      ...action,
      timestamp: Date.now(),
      retry_count: 0,
      status: "pending",
    });
  },

  /**
   * 동기화 큐 조회 (대기 중인 항목만)
   */
  async getSyncQueue() {
    const db = await initDB();
    const all = await db.getAll("sync_queue");
    return all.filter((item) => item.status === "pending");
  },

  /**
   * 동기화 큐에서 항목 제거
   */
  async clearFromSyncQueue(id) {
    const db = await initDB();
    return db.delete("sync_queue", id);
  },

  /**
   * 동기화 큐 항목 업데이트 (재시도 카운트 증가 등)
   */
  async updateSyncQueueItem(id, updates) {
    const db = await initDB();
    const item = await db.get("sync_queue", id);
    if (item) {
      await db.put("sync_queue", { ...item, ...updates });
    }
  },

  /**
   * 메타데이터 저장
   */
  async setMetadata(key, value) {
    const db = await initDB();
    return db.put("metadata", { key, value, updated_at: Date.now() });
  },

  /**
   * 메타데이터 조회
   */
  async getMetadata(key) {
    const db = await initDB();
    const result = await db.get("metadata", key);
    return result ? result.value : null;
  },

  /**
   * sync_status가 'pending'인 항목들 조회
   */
  async getPendingItems(store) {
    const db = await initDB();
    return db.getAllFromIndex(store, "sync_status", "pending");
  },

  /**
   * 특정 프로젝트의 노트들 조회
   */
  async getNotesByProject(projectId) {
    const db = await initDB();
    return db.getAllFromIndex("notes", "project_id", projectId);
  },
};

export default localDB;
