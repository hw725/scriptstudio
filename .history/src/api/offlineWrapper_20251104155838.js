import { localDB } from "../db/localDB";/**/**



/** * 🔄 오프라인 래퍼 - Supabase 클라이언트를 오프라인 지원으로 래핑 * 🔄 오프라인 래퍼 - Supabase 클라이언트를 오프라인 지원으로 래핑

 * 🔄 오프라인 래퍼 - Supabase 클라이언트를 오프라인 지원으로 래핑

 *  *  * 

 * 동작 원리:

 * 1. 온라인: Supabase API 호출 → 성공 시 로컬 캐시 저장 * 동작 원리: * 동작 원리:

 * 2. 오프라인: 로컬 캐시만 사용 → 동기화 큐에 추가

 * 3. 온라인 복귀: 큐의 작업들을 자동으로 서버에 전송 * 1. 온라인: Supabase API 호출 → 성공 시 로컬 캐시 저장 * 1. 온라인: Supabase API 호출 → 성공 시 로컬 캐시 저장

 */

 * 2. 오프라인: 로컬 캐시만 사용 → 동기화 큐에 추가 * 2. 오프라인: 로컬 캐시만 사용 → 동기화 큐에 추가

/**

 * Entity 래퍼 클래스 * 3. 온라인 복귀: 큐의 작업들을 자동으로 서버에 전송 * 3. 온라인 복귀: 큐의 작업들을 자동으로 서버에 전송

 */

class OfflineEntityWrapper { */ */

  constructor(apiEntity, storeName) {

    this.apiEntity = apiEntity;export const createOfflineWrapper = (apiClient) => {

    this.storeName = storeName;

  }/**  // Entity 래퍼 생성



  /** * Entity 래퍼 클래스  const wrappedEntities = {};

   * 목록 조회 - 온라인 우선, 실패 시 로컬

   */ */  

  async list(sortBy = "-created_date") {

    try {class OfflineEntityWrapper {  for (const [entityName, entity] of Object.entries(apiClient.entities)) {

      if (navigator.onLine) {

        // 온라인: API 호출  constructor(apiEntity, storeName) {    wrappedEntities[entityName] = new OfflineEntityWrapper(entity, entityName.toLowerCase() + "s");

        const data = await this.apiEntity.list(sortBy);

            this.apiEntity = apiEntity;  }

        // 로컬에 캐시

        await this.cacheMultiple(data);    this.storeName = storeName;

        

        return data;  }  return {

      }

    } catch (error) {    entities: wrappedEntities,

      console.warn(`⚠️ 온라인 조회 실패, 로컬 캐시 사용 (${this.storeName}):`, error);

    }  /**    auth: apiClient.auth, // 인증은 그대로 사용



    // 오프라인이거나 실패 시: 로컬에서 조회   * 목록 조회 - 온라인 우선, 실패 시 로컬    functions: apiClient.functions, // 함수도 그대로 사용

    return this.getLocalList(sortBy);

  }   */    raw: apiClient.raw, // 원시 클라이언트 접근



  /**  async list(sortBy = "-created_date") {  };

   * 단일 항목 조회

   */    try {};

  async get(id) {

    try {      if (navigator.onLine) {

      if (navigator.onLine) {

        // 온라인: API 호출        // 온라인: API 호출/**

        const data = await this.apiEntity.get(id);

                const data = await this.apiEntity.list(sortBy); * Entity 래퍼 클래스

        if (data) {

          // 로컬에 캐시         */

          await this.cacheSingle(data);

        }        // 로컬에 캐시class OfflineEntityWrapper {

        

        return data;        await this.cacheMultiple(data);  constructor(apiEntity, storeName) {

      }

    } catch (error) {            this.apiEntity = apiEntity;

      console.warn(`⚠️ 온라인 조회 실패, 로컬 캐시 사용 (${this.storeName}):`, error);

    }        return data;    this.storeName = storeName;



    // 오프라인이거나 실패 시: 로컬에서 조회      }  }

    return this.getLocalItem(id);

  }    } catch (error) {



  /**      console.warn(`⚠️ 온라인 조회 실패, 로컬 캐시 사용 (${this.storeName}):`, error);  /**

   * 생성 - 로컬 즉시 저장 + 온라인 시 서버 전송

   */    }   * 목록 조회 - 온라인 우선, 실패 시 로컬

  async create(data) {

    const item = {   */

      ...data,

      id: data.id || crypto.randomUUID(),    // 오프라인이거나 실패 시: 로컬에서 조회  async list(sortBy = "-created_date") {

      created_date: data.created_date || new Date().toISOString(),

      updated_date: data.updated_date || new Date().toISOString(),    return this.getLocalList(sortBy);    try {

      sync_status: "pending",

    };  }      if (navigator.onLine) {



    // 1. 로컬에 즉시 저장 (UX 개선)        // 온라인: API 호출

    await this.cacheSingle(item);

  /**        const data = await this.apiEntity.list(sortBy);

    // 2. 온라인이면 서버에 전송 시도

    if (navigator.onLine) {   * 단일 항목 조회        

      try {

        const serverData = await this.apiEntity.create(item);   */        // 로컬에 캐시

        

        // 서버 응답으로 로컬 업데이트  async get(id) {        await this.cacheMultiple(data);

        await this.cacheSingle({

          ...serverData,    try {        

          sync_status: "synced",

        });      if (navigator.onLine) {        return data;

        

        console.log(`✅ 생성 성공 (${this.storeName}):`, serverData.id);        // 온라인: API 호출      }

        return serverData;

      } catch (error) {        const data = await this.apiEntity.get(id);    } catch (error) {

        console.warn(`⚠️ 생성 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

      }              console.warn(`⚠️ 온라인 조회 실패, 로컬 캐시 사용 (${this.storeName}):`, error);

    }

        if (data) {    }

    // 3. 오프라인이거나 실패: 동기화 큐에 추가

    await this.addToSyncQueue("create", item);          // 로컬에 캐시

    

    return item;          await this.cacheSingle(data);    // 오프라인이거나 실패 시: 로컬에서 조회

  }

        }    return this.getLocalList(sortBy);

  /**

   * 수정 - 로컬 즉시 저장 + 온라인 시 서버 전송          }

   */

  async update(id, changes) {        return data;

    const item = {

      ...changes,      }  /**

      id,

      updated_date: new Date().toISOString(),    } catch (error) {   * 단일 항목 조회

      sync_status: "pending",

    };      console.warn(`⚠️ 온라인 조회 실패, 로컬 캐시 사용 (${this.storeName}):`, error);   */



    // 1. 로컬에 즉시 저장    }  async get(id) {

    await this.cacheSingle(item);

    try {

    // 2. 온라인이면 서버에 전송 시도

    if (navigator.onLine) {    // 오프라인이거나 실패 시: 로컬에서 조회      if (navigator.onLine) {

      try {

        const serverData = await this.apiEntity.update(id, changes);    return this.getLocalItem(id);        // 온라인: API 호출

        

        // 서버 응답으로 로컬 업데이트  }        const data = await this.apiEntity.get(id);

        await this.cacheSingle({

          ...serverData,        

          sync_status: "synced",

        });  /**        if (data) {

        

        console.log(`✅ 수정 성공 (${this.storeName}):`, id);   * 생성 - 로컬 즉시 저장 + 온라인 시 서버 전송          // 로컬에 캐시

        return serverData;

      } catch (error) {   */          await this.cacheSingle(data);

        console.warn(`⚠️ 수정 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

      }  async create(data) {        }

    }

    const item = {        

    // 3. 오프라인이거나 실패: 동기화 큐에 추가

    await this.addToSyncQueue("update", item);      ...data,        return data;

    

    return item;      id: data.id || crypto.randomUUID(),      }

  }

      created_date: data.created_date || new Date().toISOString(),    } catch (error) {

  /**

   * 삭제 - 로컬 즉시 삭제 + 온라인 시 서버 전송      updated_date: data.updated_date || new Date().toISOString(),      console.warn(`⚠️ 온라인 조회 실패, 로컬 캐시 사용 (${this.storeName}):`, error);

   */

  async delete(id) {      sync_status: "pending",    }

    // 1. 로컬에서 즉시 삭제

    await localDB.delete(this.storeName, id);    };



    // 2. 온라인이면 서버에 전송 시도    // 오프라인이거나 실패 시: 로컬에서 조회

    if (navigator.onLine) {

      try {    // 1. 로컬에 즉시 저장 (UX 개선)    return this.getLocalItem(id);

        await this.apiEntity.delete(id);

        console.log(`✅ 삭제 성공 (${this.storeName}):`, id);    await this.cacheSingle(item);  }

        return true;

      } catch (error) {

        console.warn(`⚠️ 삭제 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

      }    // 2. 온라인이면 서버에 전송 시도  /**

    }

    if (navigator.onLine) {   * 생성 - 로컬 즉시 저장 + 온라인 시 서버 전송

    // 3. 오프라인이거나 실패: 동기화 큐에 추가

    await this.addToSyncQueue("delete", { id });      try {   */

    

    return true;        const serverData = await this.apiEntity.create(item);  async create(data) {

  }

            const item = {

  // ==================== 헬퍼 메서드 ====================

        // 서버 응답으로 로컬 업데이트      ...data,

  /**

   * 단일 항목을 로컬에 캐시        await this.cacheSingle({      id: data.id || crypto.randomUUID(),

   */

  async cacheSingle(item) {          ...serverData,      created_date: data.created_date || new Date().toISOString(),

    try {

      await localDB.put(this.storeName, item);          sync_status: "synced",      updated_date: data.updated_date || new Date().toISOString(),

    } catch (error) {

      console.error(`❌ 로컬 캐시 실패 (${this.storeName}):`, error);        });      sync_status: "pending",

    }

  }            };



  /**        console.log(`✅ 생성 성공 (${this.storeName}):`, serverData.id);

   * 여러 항목을 로컬에 캐시

   */        return serverData;    // 1. 로컬에 즉시 저장 (UX 개선)

  async cacheMultiple(items) {

    try {      } catch (error) {    await this.cacheSingle(item);

      for (const item of items) {

        await localDB.put(this.storeName, item);        console.warn(`⚠️ 생성 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

      }

    } catch (error) {      }    // 2. 온라인이면 서버에 전송 시도

      console.error(`❌ 로컬 캐시 실패 (${this.storeName}):`, error);

    }    }    if (navigator.onLine) {

  }

      try {

  /**

   * 로컬에서 목록 조회    // 3. 오프라인이거나 실패: 동기화 큐에 추가        const serverData = await this.apiEntity.create(item);

   */

  async getLocalList(sortBy = "-created_date") {    await this.addToSyncQueue("create", item);        

    try {

      const items = await localDB.getAll(this.storeName);            // 서버 응답으로 로컬 업데이트

      

      // 정렬    return item;        await this.cacheSingle({

      if (sortBy.startsWith("-")) {

        const field = sortBy.substring(1);  }          ...serverData,

        items.sort((a, b) => (b[field] || "").localeCompare(a[field] || ""));

      } else {          sync_status: "synced",

        items.sort((a, b) => (a[sortBy] || "").localeCompare(b[sortBy] || ""));

      }  /**        });

      

      return items;   * 수정 - 로컬 즉시 저장 + 온라인 시 서버 전송        

    } catch (error) {

      console.error(`❌ 로컬 조회 실패 (${this.storeName}):`, error);   */        console.log(`✅ 생성 성공 (${this.storeName}):`, serverData.id);

      return [];

    }  async update(id, data) {        return serverData;

  }

    const updated = {      } catch (error) {

  /**

   * 로컬에서 단일 항목 조회      ...data,        console.warn(`⚠️ 생성 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

   */

  async getLocalItem(id) {      id,      }

    try {

      return await localDB.get(this.storeName, id);      updated_date: new Date().toISOString(),    }

    } catch (error) {

      console.error(`❌ 로컬 조회 실패 (${this.storeName}):`, error);      sync_status: "pending",

      return null;

    }    };    // 3. 오프라인이거나 실패: 동기화 큐에 추가

  }

    await this.addToSyncQueue("create", item);

  /**

   * 동기화 큐에 작업 추가    // 1. 로컬에 즉시 저장    

   */

  async addToSyncQueue(action, data) {    await this.cacheSingle(updated);    return item;

    try {

      await localDB.put("syncQueue", {  }

        id: crypto.randomUUID(),

        store: this.storeName,    // 2. 온라인이면 서버에 전송 시도

        action,

        data,    if (navigator.onLine) {  /**

        timestamp: Date.now(),

        status: "pending",      try {   * 수정 - 로컬 즉시 저장 + 온라인 시 서버 전송

      });

      console.log(`📦 동기화 큐에 추가 (${action}):`, this.storeName);        const serverData = await this.apiEntity.update(id, data);   */

    } catch (error) {

      console.error(`❌ 동기화 큐 추가 실패 (${this.storeName}):`, error);          async update(id, data) {

    }

  }        // 서버 응답으로 로컬 업데이트    const updated = {

}

        await this.cacheSingle({      ...data,

/**

 * 오프라인 래퍼 생성 함수          ...serverData,      id,

 */

export const createOfflineWrapper = (apiClient) => {          sync_status: "synced",      updated_date: new Date().toISOString(),

  // Entity 래퍼 생성

  const wrappedEntities = {};        });      sync_status: "pending",

  

  for (const [entityName, entity] of Object.entries(apiClient.entities)) {            };

    wrappedEntities[entityName] = new OfflineEntityWrapper(

      entity,         console.log(`✅ 수정 성공 (${this.storeName}):`, id);

      entityName.toLowerCase() + "s"

    );        return serverData;    // 1. 로컬에 즉시 저장

  }

      } catch (error) {    await this.cacheSingle(updated);

  return {

    entities: wrappedEntities,        console.warn(`⚠️ 수정 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

    auth: apiClient.auth, // 인증은 그대로 사용

    functions: apiClient.functions, // 함수도 그대로 사용      }    // 2. 온라인이면 서버에 전송 시도

    raw: apiClient.raw, // 원시 클라이언트 접근

  };    }    if (navigator.onLine) {

};

      try {

    // 3. 오프라인이거나 실패: 동기화 큐에 추가        const serverData = await this.apiEntity.update(id, data);

    await this.addToSyncQueue("update", updated);        

            // 서버 응답으로 로컬 업데이트

    return updated;        await this.cacheSingle({

  }          ...serverData,

          sync_status: "synced",

  /**        });

   * 삭제 - 로컬 즉시 삭제 + 온라인 시 서버 전송        

   */        console.log(`✅ 수정 성공 (${this.storeName}):`, id);

  async delete(id) {        return serverData;

    // 1. 로컬에서 즉시 삭제      } catch (error) {

    await this.deleteLocal(id);        console.warn(`⚠️ 수정 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

      }

    // 2. 온라인이면 서버에 전송 시도    }

    if (navigator.onLine) {

      try {    // 3. 오프라인이거나 실패: 동기화 큐에 추가

        await this.apiEntity.delete(id);    await this.addToSyncQueue("update", updated);

        console.log(`✅ 삭제 성공 (${this.storeName}):`, id);    

        return { success: true };    return updated;

      } catch (error) {  }

        console.warn(`⚠️ 삭제 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

      }  /**

    }   * 삭제 - 로컬 즉시 삭제 + 온라인 시 서버 전송

   */

    // 3. 오프라인이거나 실패: 동기화 큐에 추가  async delete(id) {

    await this.addToSyncQueue("delete", { id });    // 1. 로컬에서 즉시 삭제

        await this.deleteLocal(id);

    return { success: true };

  }    // 2. 온라인이면 서버에 전송 시도

    if (navigator.onLine) {

  /**      try {

   * 일괄 삭제        await this.apiEntity.delete(id);

   */        console.log(`✅ 삭제 성공 (${this.storeName}):`, id);

  async deleteMany(ids) {        return { success: true };

    // 1. 로컬에서 즉시 삭제      } catch (error) {

    for (const id of ids) {        console.warn(`⚠️ 삭제 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

      await this.deleteLocal(id);      }

    }    }



    // 2. 온라인이면 서버에 전송 시도    // 3. 오프라인이거나 실패: 동기화 큐에 추가

    if (navigator.onLine) {    await this.addToSyncQueue("delete", { id });

      try {    

        await this.apiEntity.deleteMany(ids);    return { success: true };

        console.log(`✅ 일괄 삭제 성공 (${this.storeName}):`, ids.length);  }

        return { success: true, count: ids.length };

      } catch (error) {  /**

        console.warn(`⚠️ 일괄 삭제 실패, 동기화 큐에 추가 (${this.storeName}):`, error);   * 일괄 삭제

      }   */

    }  async deleteMany(ids) {

    // 1. 로컬에서 즉시 삭제

    // 3. 오프라인이거나 실패: 동기화 큐에 추가    for (const id of ids) {

    for (const id of ids) {      await this.deleteLocal(id);

      await this.addToSyncQueue("delete", { id });    }

    }

        // 2. 온라인이면 서버에 전송 시도

    return { success: true, count: ids.length };    if (navigator.onLine) {

  }      try {

        await this.apiEntity.deleteMany(ids);

  // === 로컬 캐시 헬퍼 메서드 ===        console.log(`✅ 일괄 삭제 성공 (${this.storeName}):`, ids.length);

        return { success: true, count: ids.length };

  async cacheSingle(item) {      } catch (error) {

    const { localDB } = await import("../db/localDB");        console.warn(`⚠️ 일괄 삭제 실패, 동기화 큐에 추가 (${this.storeName}):`, error);

    await localDB.put(this.storeName, item);      }

  }    }



  async cacheMultiple(items) {    // 3. 오프라인이거나 실패: 동기화 큐에 추가

    const { localDB } = await import("../db/localDB");    for (const id of ids) {

    for (const item of items) {      await this.addToSyncQueue("delete", { id });

      await localDB.put(this.storeName, item);    }

    }    

  }    return { success: true, count: ids.length };

  }

  async getLocalList(sortBy) {

    const { localDB } = await import("../db/localDB");  // === 로컬 캐시 헬퍼 메서드 ===

    const items = await localDB.getAll(this.storeName);

  async cacheSingle(item) {

    // 정렬    const { localDB } = await import("../db/localDB");

    if (sortBy) {    await localDB.put(this.storeName, item);

      const [order, field] = sortBy.startsWith("-")  }

        ? ["desc", sortBy.slice(1)]

        : ["asc", sortBy];  async cacheMultiple(items) {

    const { localDB } = await import("../db/localDB");

      items.sort((a, b) => {    for (const item of items) {

        const aVal = a[field] || 0;      await localDB.put(this.storeName, item);

        const bVal = b[field] || 0;    }

        return order === "desc"   }

          ? (bVal > aVal ? 1 : -1)

          : (aVal > bVal ? 1 : -1);  async getLocalList(sortBy) {

      });    const { localDB } = await import("../db/localDB");

    }    const items = await localDB.getAll(this.storeName);



    return items;    // 정렬

  }    if (sortBy) {

      const [order, field] = sortBy.startsWith("-")

  async getLocalItem(id) {        ? ["desc", sortBy.slice(1)]

    const { localDB } = await import("../db/localDB");        : ["asc", sortBy];

    return localDB.get(this.storeName, id);

  }      items.sort((a, b) => {

        const aVal = a[field] || 0;

  async deleteLocal(id) {        const bVal = b[field] || 0;

    const { localDB } = await import("../db/localDB");        return order === "desc" 

    await localDB.delete(this.storeName, id);          ? (bVal > aVal ? 1 : -1)

  }          : (aVal > bVal ? 1 : -1);

      });

  async addToSyncQueue(action, data) {    }

    const { localDB } = await import("../db/localDB");

    await localDB.addToSyncQueue({    return items;

      action,  }

      store: this.storeName,

      data,  async getLocalItem(id) {

      timestamp: Date.now(),    const { localDB } = await import("../db/localDB");

    });    return localDB.get(this.storeName, id);

  }  }

}

  async deleteLocal(id) {

/**    const { localDB } = await import("../db/localDB");

 * API 클라이언트를 오프라인 래퍼로 감싸기    await localDB.delete(this.storeName, id);

 */  }

export const createOfflineWrapper = (apiClient) => {

  // Entity 래퍼 생성  async addToSyncQueue(action, data) {

  const wrappedEntities = {};    const { localDB } = await import("../db/localDB");

      await localDB.addToSyncQueue({

  for (const [entityName, entity] of Object.entries(apiClient.entities)) {      action,

    wrappedEntities[entityName] = new OfflineEntityWrapper(entity, entityName.toLowerCase() + "s");      store: this.storeName,

  }      data,

      timestamp: Date.now(),

  return {    });

    entities: wrappedEntities,  }

    auth: apiClient.auth, // 인증은 그대로 사용}

    functions: apiClient.functions, // 함수도 그대로 사용

    raw: apiClient.raw, // 원시 클라이언트 접근  return {

  };    /**

};     * GET 요청

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
        console.warn("API 호출 실패, 로컬 캐시 사용:", error);
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
        updated_at: data.updated_at || Date.now(),
      };

      // 로컬에 즉시 저장
      const localData = await localDB.put(store, dataWithId);

      if (navigator.onLine) {
        try {
          // 온라인 - 즉시 서버 전송 시도
          const serverData = await apiClient.post(
            endpoint,
            dataWithId,
            options
          );

          // 서버 응답으로 로컬 업데이트
          await localDB.put(store, {
            ...serverData,
            sync_status: "synced",
          });

          console.log("✅ POST 성공:", endpoint);
          return serverData;
        } catch (error) {
          console.warn("⚠️ POST 실패, 동기화 큐에 추가:", error);
        }
      }

      // 오프라인이거나 실패 시 동기화 큐에 추가
      await localDB.addToSyncQueue({
        action: "create",
        store,
        data: localData,
        endpoint,
        options,
      });

      console.log("📦 동기화 큐에 추가 (POST):", endpoint);
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
        updated_at: Date.now(),
      };

      // 로컬에 즉시 저장
      const localData = await localDB.put(store, dataWithTime);

      if (navigator.onLine) {
        try {
          // 온라인 - 즉시 서버 전송 시도
          const serverData = await apiClient.put(
            endpoint,
            dataWithTime,
            options
          );

          // 서버 응답으로 로컬 업데이트
          await localDB.put(store, {
            ...serverData,
            sync_status: "synced",
          });

          console.log("✅ PUT 성공:", endpoint);
          return serverData;
        } catch (error) {
          console.warn("⚠️ PUT 실패, 동기화 큐에 추가:", error);
        }
      }

      // 오프라인이거나 실패 시 동기화 큐에 추가
      await localDB.addToSyncQueue({
        action: "update",
        store,
        data: localData,
        endpoint,
        options,
      });

      console.log("📦 동기화 큐에 추가 (PUT):", endpoint);
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
        throw new Error("DELETE 요청에는 ID가 필요합니다");
      }

      // 로컬에서 즉시 삭제
      await localDB.delete(store, id);

      if (navigator.onLine) {
        try {
          // 온라인 - 즉시 서버 전송 시도
          await apiClient.delete(endpoint, options);

          console.log("✅ DELETE 성공:", endpoint);
          return;
        } catch (error) {
          console.warn("⚠️ DELETE 실패, 동기화 큐에 추가:", error);
        }
      }

      // 오프라인이거나 실패 시 동기화 큐에 추가
      await localDB.addToSyncQueue({
        action: "delete",
        store,
        id,
        endpoint,
        options,
      });

      console.log("📦 동기화 큐에 추가 (DELETE):", endpoint);
    },

    /**
     * endpoint에서 store 이름 추출
     * 예: '/notes/123' → 'notes'
     */
    getStoreFromEndpoint(endpoint) {
      const match = endpoint.match(/^\/(\w+)/);
      if (!match) {
        console.warn("⚠️ endpoint에서 store 추출 실패:", endpoint);
        return "notes"; // 기본값
      }

      const store = match[1];

      // 알려진 store인지 확인
      const knownStores = ["notes", "projects", "templates", "references"];
      if (!knownStores.includes(store)) {
        console.warn("⚠️ 알 수 없는 store:", store);
      }

      return store;
    },

    /**
     * endpoint에서 ID 추출
     * 예: '/notes/123' → '123'
     */
    getIdFromEndpoint(endpoint) {
      const parts = endpoint.split("/").filter(Boolean);
      // 마지막 부분이 ID인지 확인 (숫자 또는 UUID 형태)
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        // 쿼리 파라미터 제거
        const id = lastPart.split("?")[0];
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
        const items = data.map((item) => ({
          ...item,
          sync_status: "synced",
        }));
        await localDB.putMany(store, items);
        console.log(`💾 ${store}에 ${items.length}개 항목 캐시됨`);
      } else if (data && typeof data === "object") {
        // 단일 객체 저장
        await localDB.put(store, {
          ...data,
          sync_status: "synced",
        });
        console.log(`💾 ${store}에 항목 캐시됨:`, data.id);
      }
    },

    /**
     * 고유 ID 생성
     */
    generateId() {
      return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
  };
};

/**
 * 오프라인 지원 API 클라이언트 생성 헬퍼
 */
export const wrapApiClient = (apiClient) => {
  return createOfflineWrapper(apiClient);
};

export default createOfflineWrapper;
