import { localDB } from "../db/localDB";

/**
 * 로컬 전용 모드 - Base44 API 없이 IndexedDB만 사용
 * 네트워크 연결이나 인증 없이 완전히 독립적으로 작동
 */

// Mock entity 클래스
class LocalEntity {
  constructor(storeName) {
    this.storeName = storeName;
  }

  async list(sortBy = "-created_date") {
    console.log(`📥 로컬에서 ${this.storeName} 목록 가져오기`);
    const items = await localDB.getAll(this.storeName);

    // 정렬
    if (sortBy) {
      const [order, field] = sortBy.startsWith("-")
        ? ["desc", sortBy.slice(1)]
        : ["asc", sortBy];

      items.sort((a, b) => {
        const aVal = a[field] || 0;
        const bVal = b[field] || 0;
        return order === "desc" ? bVal - aVal : aVal - bVal;
      });
    }

    return items;
  }

  async get(id) {
    console.log(`📥 로컬에서 ${this.storeName} 항목 가져오기:`, id);
    return localDB.get(this.storeName, id);
  }

  async create(data) {
    console.log(`✏️ 로컬에 ${this.storeName} 생성:`, data);
    const item = {
      ...data,
      id:
        data.id ||
        `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_date: data.created_date || Date.now(),
      updated_date: data.updated_date || Date.now(),
    };

    await localDB.put(this.storeName, item);
    return item;
  }

  async update(id, data) {
    console.log(`✏️ 로컬에서 ${this.storeName} 업데이트:`, id);
    const existing = await localDB.get(this.storeName, id);
    if (!existing) {
      throw new Error(`${this.storeName} 항목을 찾을 수 없습니다: ${id}`);
    }

    const updated = {
      ...existing,
      ...data,
      id, // ID는 변경하지 않음
      updated_date: Date.now(),
    };

    await localDB.put(this.storeName, updated);
    return updated;
  }

  async delete(id) {
    console.log(`🗑️ 로컬에서 ${this.storeName} 삭제:`, id);
    await localDB.delete(this.storeName, id);
    return { success: true };
  }

  async deleteMany(ids) {
    console.log(`🗑️ 로컬에서 ${this.storeName} 일괄 삭제:`, ids);
    for (const id of ids) {
      await localDB.delete(this.storeName, id);
    }
    return { success: true, count: ids.length };
  }
}

// Mock 인증
const mockAuth = {
  async getCurrentUser() {
    console.log("👤 로컬 모드 - 인증 우회");
    return {
      id: "local_user",
      email: "local@scriptstudio.local",
      name: "로컬 사용자",
      isLocal: true,
    };
  },

  async signOut() {
    console.log("👋 로컬 모드 - 로그아웃 불필요");
    return { success: true };
  },

  isAuthenticated: true,
};

// 로컬 전용 클라이언트
export const localClient = {
  entities: {
    Note: new LocalEntity("notes"),
    Folder: new LocalEntity("folders"),
    Reference: new LocalEntity("references"),
    Project: new LocalEntity("projects"),
    Template: new LocalEntity("templates"),
    ProjectSettings: new LocalEntity("project_settings"),
    CitationStyle: new LocalEntity("citation_styles"),
    NoteVersion: new LocalEntity("note_versions"),
    DailyNote: new LocalEntity("daily_notes"),
  },

  auth: mockAuth,

  // Mock functions for local mode
  functions: {
    syncRefManager: async () => {
      console.log("📚 로컬 모드 - syncRefManager (실제 동작 없음)");
      return {
        success: true,
        message: "로컬 모드에서는 동기화가 필요하지 않습니다",
      };
    },
    syncVJOCR: async () => {
      console.log("🔤 로컬 모드 - syncVJOCR (실제 동작 없음)");
      return {
        success: true,
        message: "로컬 모드에서는 OCR이 지원되지 않습니다",
      };
    },
    syncPomoFlow: async () => {
      console.log("⏱️ 로컬 모드 - syncPomoFlow (실제 동작 없음)");
      return {
        success: true,
        message: "로컬 모드에서는 PomoFlow가 지원되지 않습니다",
      };
    },
    exportData: async () => {
      console.log("📤 로컬 모드 - exportData (실제 동작 없음)");
      return {
        success: true,
        message: "로컬 모드에서는 내보내기가 지원되지 않습니다",
      };
    },
  },

  // HTTP 메서드 (필요시)
  async get(endpoint) {
    const store = endpoint.split("/")[1];
    return localDB.getAll(store);
  },

  async post(endpoint, data) {
    const store = endpoint.split("/")[1];
    return this.entities[store]?.create(data);
  },

  async put(endpoint, data) {
    const parts = endpoint.split("/");
    const store = parts[1];
    const id = parts[2];
    return this.entities[store]?.update(id, data);
  },

  async delete(endpoint) {
    const parts = endpoint.split("/");
    const store = parts[1];
    const id = parts[2];
    return this.entities[store]?.delete(id);
  },
};

export default localClient;
