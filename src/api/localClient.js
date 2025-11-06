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

// Project entity with CASCADE delete
class ProjectEntity extends LocalEntity {
  constructor() {
    super("projects");
  }

  async delete(id) {
    console.log(`🗑️ 로컬에서 프로젝트 CASCADE 삭제:`, id);

    try {
      // 1. 프로젝트에 속한 노트들 삭제 (CASCADE)
      const notes = await localDB.getAllByIndex("notes", "project_id", id);
      for (const note of notes) {
        await localDB.delete("notes", note.id);
      }

      // 2. 프로젝트에 속한 폴더들 삭제 (CASCADE)
      const folders = await localDB.getAllByIndex("folders", "project_id", id);
      for (const folder of folders) {
        await localDB.delete("folders", folder.id);
      }

      // 참고문헌 기능 제거됨

      // 4. 프로젝트 설정 삭제 (CASCADE)
      const allSettings = await localDB.getAll("project_settings");
      const projectSettings = allSettings.filter((s) => s.project_id === id);
      for (const setting of projectSettings) {
        await localDB.delete("project_settings", setting.id);
      }

      // 5. 프로젝트 자체 삭제
      await localDB.delete(this.storeName, id);

      console.log(`✅ 프로젝트 ${id} 및 관련 데이터 모두 삭제 완료`);
      return { success: true };
    } catch (error) {
      console.error("프로젝트 삭제 실패:", error);
      throw error;
    }
  }
}

// Folder entity with CASCADE delete
class FolderEntity extends LocalEntity {
  constructor() {
    super("folders");
  }

  async delete(id) {
    console.log(`🗑️ 로컬에서 폴더 CASCADE 삭제:`, id);

    try {
      // 1. 하위 폴더들 찾아서 재귀적으로 삭제
      const allFolders = await localDB.getAll("folders");
      const childFolders = allFolders.filter((f) => f.parent_id === id);
      for (const child of childFolders) {
        await this.delete(child.id); // 재귀 호출
      }

      // 2. 이 폴더에 속한 노트들 삭제 (CASCADE)
      const allNotes = await localDB.getAll("notes");
      const folderNotes = allNotes.filter((n) => n.folder_id === id);
      for (const note of folderNotes) {
        await localDB.delete("notes", note.id);
      }

      // 3. 폴더 자체 삭제
      await localDB.delete(this.storeName, id);

      console.log(`✅ 폴더 ${id} 및 하위 항목 모두 삭제 완료`);
      return { success: true };
    } catch (error) {
      console.error("폴더 삭제 실패:", error);
      throw error;
    }
  }
}

// 로컬 전용 클라이언트
export const localClient = {
  entities: {
    Note: new LocalEntity("notes"),
    Folder: new FolderEntity(), // CASCADE 삭제 지원
    Project: new ProjectEntity(), // CASCADE 삭제 지원
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
