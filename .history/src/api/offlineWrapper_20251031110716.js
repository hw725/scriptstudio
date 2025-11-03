import { localDB } from '../db/localDB';
import { syncManager } from '../sync/syncManager';

/**
 * API 클라이언트를 오프라인 지원으로 래핑
 * 온라인 시: 기존 API 사용 + 로컬 캐시
 * 오프라인 시: 로컬 DB만 사용 + 동기화 큐에 추가
 */
export const createOfflineWrapper = (apiClient) => {
  // syncManager에 API 클라이언트 설정
  syncManager.setApiClient(apiClient);
  
  return {
    /**
     * GET 요청
     * 온라인: API 호출 → 로컬 캐시
     * 오프라인: 로컬 캐시만 사용
     */
    async get(endpoint, options = {}) {
      const store = this.getStoreFromEndpoint(endpoint);
      const id = this.getIdFromEndpoint(endpoint);
      
      try {
        if (navigator.onLine) {
          // 온라인 - API 호출
          const data = await apiClient.get(endpoint, options);
          
          // 로컬에 캐시
          if (data) {
            await this.cacheData(store, data);
          }
          
          return data;
        }
      } catch (error) {
        console.warn('API 호출 실패, 로컬 캐시 사용:', error);
      }
      
      // 오프라인이거나 API 실패 시 로컬 캐시 사용
      if (id) {
        // 단일 항목 조회
        return localDB.get(store, id);
      } else {
        // 전체 목록 조회
        return localDB.getAll(store);
      }
    },
    
    /**
     * POST 요청 (생성)
     * 로컬에 즉시 저장 → 온라인 시 서버 전송
     */
    async post(endpoint, data, options = {}) {
      const store = this.getStoreFromEndpoint(endpoint);
      
      // ID가 없으면 생성
      const dataWithId = {
        ...data,
        id: data.id || this.generateId(),
        created_at: data.created_at || Date.now(),
        updated_at: data.updated_at || Date.now()
      };
      
      // 로컬에 즉시 저장
      const localData = await localDB.put(store, dataWithId);
      
      if (navigator.onLine) {
        try {
          // 온라인 - 즉시 서버 전송 시도
          const serverData = await apiClient.post(endpoint, dataWithId, options);
          
          // 서버 응답으로 로컬 업데이트
          await localDB.put(store, {
            ...serverData,
            sync_status: 'synced'
          });
          
          console.log('✅ POST 성공:', endpoint);
          return serverData;
        } catch (error) {
          console.warn('⚠️ POST 실패, 동기화 큐에 추가:', error);
        }
      }
      
      // 오프라인이거나 실패 시 동기화 큐에 추가
      await localDB.addToSyncQueue({
        action: 'create',
        store,
        data: localData,
        endpoint,
        options
      });
      
      console.log('📦 동기화 큐에 추가 (POST):', endpoint);
      return localData;
    },
    
    /**
     * PUT 요청 (업데이트)
     * 로컬에 즉시 저장 → 온라인 시 서버 전송
     */
    async put(endpoint, data, options = {}) {
      const store = this.getStoreFromEndpoint(endpoint);
      
      // 업데이트 시간 추가
      const dataWithTime = {
        ...data,
        updated_at: Date.now()
      };
      
      // 로컬에 즉시 저장
      const localData = await localDB.put(store, dataWithTime);
      
      if (navigator.onLine) {
        try {
          // 온라인 - 즉시 서버 전송 시도
          const serverData = await apiClient.put(endpoint, dataWithTime, options);
          
          // 서버 응답으로 로컬 업데이트
          await localDB.put(store, {
            ...serverData,
            sync_status: 'synced'
          });
          
          console.log('✅ PUT 성공:', endpoint);
          return serverData;
        } catch (error) {
          console.warn('⚠️ PUT 실패, 동기화 큐에 추가:', error);
        }
      }
      
      // 오프라인이거나 실패 시 동기화 큐에 추가
      await localDB.addToSyncQueue({
        action: 'update',
        store,
        data: localData,
        endpoint,
        options
      });
      
      console.log('📦 동기화 큐에 추가 (PUT):', endpoint);
      return localData;
    },
    
    /**
     * PATCH 요청 (부분 업데이트)
     * PUT과 동일하게 처리
     */
    async patch(endpoint, data, options = {}) {
      return this.put(endpoint, data, options);
    },
    
    /**
     * DELETE 요청
     * 로컬에서 즉시 삭제 → 온라인 시 서버 전송
     */
    async delete(endpoint, options = {}) {
      const store = this.getStoreFromEndpoint(endpoint);
      const id = this.getIdFromEndpoint(endpoint);
      
      if (!id) {
        throw new Error('DELETE 요청에는 ID가 필요합니다');
      }
      
      // 로컬에서 즉시 삭제
      await localDB.delete(store, id);
      
      if (navigator.onLine) {
        try {
          // 온라인 - 즉시 서버 전송 시도
          await apiClient.delete(endpoint, options);
          
          console.log('✅ DELETE 성공:', endpoint);
          return;
        } catch (error) {
          console.warn('⚠️ DELETE 실패, 동기화 큐에 추가:', error);
        }
      }
      
      // 오프라인이거나 실패 시 동기화 큐에 추가
      await localDB.addToSyncQueue({
        action: 'delete',
        store,
        id,
        endpoint,
        options
      });
      
      console.log('📦 동기화 큐에 추가 (DELETE):', endpoint);
    },
    
    /**
     * endpoint에서 store 이름 추출
     * 예: '/notes/123' → 'notes'
     */
    getStoreFromEndpoint(endpoint) {
      const match = endpoint.match(/^\/(\w+)/);
      if (!match) {
        console.warn('⚠️ endpoint에서 store 추출 실패:', endpoint);
        return 'notes'; // 기본값
      }
      
      const store = match[1];
      
      // 알려진 store인지 확인
      const knownStores = ['notes', 'projects', 'templates', 'references'];
      if (!knownStores.includes(store)) {
        console.warn('⚠️ 알 수 없는 store:', store);
      }
      
      return store;
    },
    
    /**
     * endpoint에서 ID 추출
     * 예: '/notes/123' → '123'
     */
    getIdFromEndpoint(endpoint) {
      const parts = endpoint.split('/').filter(Boolean);
      // 마지막 부분이 ID인지 확인 (숫자 또는 UUID 형태)
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        // 쿼리 파라미터 제거
        const id = lastPart.split('?')[0];
        return id;
      }
      return null;
    },
    
    /**
     * 데이터를 로컬에 캐시
     */
    async cacheData(store, data) {
      if (Array.isArray(data)) {
        // 배열 - 여러 항목 저장
        const items = data.map(item => ({
          ...item,
          sync_status: 'synced'
        }));
        await localDB.putMany(store, items);
        console.log(`💾 ${store}에 ${items.length}개 항목 캐시됨`);
      } else if (data && typeof data === 'object') {
        // 단일 객체 저장
        await localDB.put(store, {
          ...data,
          sync_status: 'synced'
        });
        console.log(`💾 ${store}에 항목 캐시됨:`, data.id);
      }
    },
    
    /**
     * 고유 ID 생성
     */
    generateId() {
      return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };
};

/**
 * 오프라인 지원 API 클라이언트 생성 헬퍼
 */
export const wrapApiClient = (apiClient) => {
  return createOfflineWrapper(apiClient);
};

export default createOfflineWrapper;
