import { localDB } from "../db/localDB";

/**
 * 동기화 매니저
 * 온라인/오프라인 상태를 관리하고 자동 동기화를 수행
 */
class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.apiClient = null; // 나중에 설정됨

    // 온라인/오프라인 이벤트 리스너
    window.addEventListener("online", () => {
      console.log("🟢 온라인 상태로 전환");
      this.isOnline = true;
      this.notifyListeners("online");
      this.sync();
    });

    window.addEventListener("offline", () => {
      console.log("🔴 오프라인 상태로 전환");
      this.isOnline = false;
      this.notifyListeners("offline");
    });
  }

  /**
   * API 클라이언트 설정
   */
  setApiClient(client) {
    this.apiClient = client;
  }

  /**
   * 온라인 상태 변경 리스너 등록
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * 리스너 제거
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  /**
   * 리스너들에게 알림
   */
  notifyListeners(status) {
    this.listeners.forEach((callback) => callback(status));
  }

  /**
   * 자동 동기화 시작
   * @param {number} intervalMs - 동기화 간격 (밀리초)
   */
  startAutoSync(intervalMs = 30000) {
    console.log(`⏰ 자동 동기화 시작 (${intervalMs / 1000}초마다)`);

    // 즉시 한 번 동기화
    if (this.isOnline) {
      this.sync();
    }

    // 주기적 동기화
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync();
      }
    }, intervalMs);
  }

  /**
   * 자동 동기화 중지
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("⏹️ 자동 동기화 중지");
    }
  }

  /**
   * 수동 동기화 실행
   */
  async sync() {
    if (this.isSyncing) {
      console.log("⏳ 이미 동기화 중...");
      return { success: false, reason: "already_syncing" };
    }

    if (!this.isOnline) {
      console.log("📵 오프라인 상태 - 동기화 불가");
      return { success: false, reason: "offline" };
    }

    if (!this.apiClient) {
      console.warn("⚠️ API 클라이언트가 설정되지 않음");
      return { success: false, reason: "no_api_client" };
    }

    this.isSyncing = true;
    console.log("🔄 동기화 시작...");

    try {
      // 1. 서버에서 최신 데이터 가져오기 (Pull)
      await this.pullFromServer();

      // 2. 로컬 변경사항 서버에 전송 (Push)
      await this.pushToServer();

      // 3. 마지막 동기화 시간 저장
      await localDB.setMetadata("last_sync", Date.now());

      console.log("✅ 동기화 완료");
      this.notifyListeners("synced");

      return { success: true };
    } catch (error) {
      console.error("❌ 동기화 실패:", error);
      return { success: false, error };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 서버에서 데이터 가져오기
   */
  async pullFromServer() {
    console.log("⬇️ 서버에서 데이터 가져오는 중...");

    const stores = ["notes", "projects", "templates", "references", "folders"];

    for (const storeName of stores) {
      try {
        // 서버에서 데이터 가져오기
        const serverData = await this.fetchFromServer(storeName);

        if (!serverData || !Array.isArray(serverData)) {
          continue;
        }

        // 로컬 데이터 가져오기
        const localData = await localDB.getAll(storeName);
        const localMap = new Map(localData.map((item) => [item.id, item]));

        // 서버 데이터와 비교하여 업데이트
        for (const serverItem of serverData) {
          const localItem = localMap.get(serverItem.id);

          if (!localItem) {
            // 로컬에 없는 항목 - 추가
            await localDB.put(storeName, {
              ...serverItem,
              sync_status: "synced",
            });
          } else {
            // 로컬에 있는 항목 - 타임스탬프 비교
            const serverTime =
              serverItem.updated_at || serverItem.updated_date || 0;
            const localTime =
              localItem.updated_at || localItem.updated_date || 0;

            if (new Date(serverTime) > new Date(localTime)) {
              // 서버가 더 최신
              if (localItem.sync_status === "pending") {
                // 충돌 발생 - 처리 필요
                await this.handleConflict(storeName, localItem, serverItem);
              } else {
                // 서버 버전으로 업데이트
                await localDB.put(storeName, {
                  ...serverItem,
                  sync_status: "synced",
                });
              }
            }
          }
        }

        console.log(
          `✅ ${storeName} 동기화 완료 (${serverData.length}개 항목)`
        );
      } catch (error) {
        console.error(`❌ ${storeName} 가져오기 실패:`, error);
      }
    }
  }

  /**
   * 로컬 변경사항을 서버로 전송
   */
  async pushToServer() {
    console.log("⬆️ 로컬 변경사항 서버로 전송 중...");

    const queue = await localDB.getSyncQueue();
    console.log(`📦 동기화 큐: ${queue.length}개 항목`);

    if (!this.apiClient || !this.apiClient.entities) {
      console.error("❌ API 클라이언트 또는 entities가 없습니다");
      return;
    }

    for (const item of queue) {
      try {
        let success = false;

        // storeName으로 entity 찾기 (notes -> Note, folders -> Folder 등)
        const entityName = this.getEntityName(item.storeName);
        const entity = this.apiClient.entities[entityName];

        if (!entity) {
          console.warn(`⚠️ Entity를 찾을 수 없음: ${entityName}`);
          continue;
        }

        switch (item.action) {
          case "create":
            await entity.create(item.data);
            success = true;
            break;

          case "update":
            await entity.update(item.data.id, item.data);
            success = true;
            break;

          case "delete":
            await entity.delete(item.data.id);
            success = true;
            break;

          default:
            console.warn(`⚠️ 알 수 없는 액션: ${item.action}`);
        }

        if (success) {
          // 성공하면 큐에서 제거
          await localDB.clearFromSyncQueue(item.id);

          // 로컬 데이터 sync_status 업데이트
          if (item.action !== "delete" && item.data?.id) {
            const localItem = await localDB.get(item.storeName, item.data.id);
            if (localItem) {
              await localDB.put(item.storeName, {
                ...localItem,
                sync_status: "synced",
              });
            }
          }

          console.log(
            `✅ ${item.action} 성공: ${item.storeName}/${item.data?.id || ""}`
          );
        }
      } catch (error) {
        console.error(`❌ ${item.action} 실패:`, error);

        // 재시도 카운트 증가
        const retryCount = (item.retry_count || 0) + 1;

        if (retryCount < 3) {
          // 3번까지 재시도
          await localDB.updateSyncQueueItem(item.id, {
            retry_count: retryCount,
            last_error: error.message,
          });
        } else {
          // 3번 실패 시 실패 상태로 표시
          await localDB.updateSyncQueueItem(item.id, {
            status: "failed",
            retry_count: retryCount,
            last_error: error.message,
          });
          console.error(`💥 ${item.action} 최종 실패 (${retryCount}번 시도)`);
        }
      }
    }
  }

  /**
   * storeName(소문자 복수형)을 Entity 이름(대문자 단수형)으로 변환
   */
  getEntityName(storeName) {
    const mapping = {
      notes: "Note",
      folders: "Folder",
      references: "Reference",
      projects: "Project",
      templates: "Template",
      project_settings: "ProjectSettings",
      citation_styles: "CitationStyle",
      note_versions: "NoteVersion",
      daily_notes: "DailyNote",
    };
    return mapping[storeName] || storeName;
  }

  /**
   * 서버에서 특정 store의 데이터 가져오기
   */
  async fetchFromServer(storeName) {
    if (!this.apiClient || !this.apiClient.entities) {
      console.error("❌ API 클라이언트 또는 entities가 없습니다");
      return [];
    }

    const entityName = this.getEntityName(storeName);
    const entity = this.apiClient.entities[entityName];

    if (!entity) {
      console.warn(`⚠️ Entity를 찾을 수 없음: ${entityName}`);
      return [];
    }

    return entity.list();
  }

  /**
   * 충돌 해결
   * Last-Write-Wins 전략 사용
   */
  async handleConflict(store, localItem, serverItem) {
    console.warn("⚠️ 충돌 감지:", {
      store,
      id: localItem.id,
      localTime: localItem.updated_at,
      serverTime: serverItem.updated_at,
    });

    // Last-Write-Wins: 더 최근 타임스탬프를 가진 버전 선택
    if (localItem.updated_at > serverItem.updated_at) {
      // 로컬이 더 최신 - 서버에 푸시
      console.log("📤 로컬 버전이 더 최신 - 서버로 푸시");
      await localDB.addToSyncQueue({
        action: "update",
        store,
        data: localItem,
        endpoint: `/${store}/${localItem.id}`,
      });
    } else {
      // 서버가 더 최신 - 로컬 업데이트
      console.log("📥 서버 버전이 더 최신 - 로컬 업데이트");

      // 로컬 버전 백업
      await localDB.put(store, {
        ...serverItem,
        sync_status: "synced",
        conflict_backup: localItem,
        conflict_resolved_at: Date.now(),
      });

      // 사용자에게 알림
      this.notifyConflict(store, localItem, serverItem);
    }
  }

  /**
   * 충돌 알림
   */
  notifyConflict(store, localItem, serverItem) {
    console.warn("📢 충돌 알림:", {
      store,
      item: localItem.id || localItem.title,
      message:
        "서버 버전으로 업데이트되었습니다. 로컬 변경사항은 백업되었습니다.",
    });

    // TODO: Toast 알림이나 UI 알림 추가
    this.notifyListeners("conflict", { store, localItem, serverItem });
  }

  /**
   * 동기화 상태 조회
   */
  async getSyncStatus() {
    const pendingQueue = await localDB.getSyncQueue();
    const lastSync = await localDB.getMetadata("last_sync");

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingChanges: pendingQueue.length,
      lastSync: lastSync ? new Date(lastSync) : null,
    };
  }

  /**
   * 특정 store의 pending 항목 개수 조회
   */
  async getPendingCount(store) {
    const pending = await localDB.getPendingItems(store);
    return pending.length;
  }
}

// 싱글톤 인스턴스
export const syncManager = new SyncManager();

export default syncManager;
