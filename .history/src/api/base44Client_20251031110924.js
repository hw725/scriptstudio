import { createClient } from "@base44/sdk";
import { createOfflineWrapper } from "./offlineWrapper";
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
const base44Original = createClient({
  appId: "686c833faa6ba9f57e0dbbba",
  requiresAuth: true, // Ensure authentication is required for all operations
});

// Wrap with offline support
// 온라인: 기존 Base44 API 사용 + 로컬 캐시
// 오프라인: 로컬 DB만 사용 + 자동 동기화 큐 관리
export const base44 = {
  ...base44Original,
  // entities는 원본 사용 (내부적으로 HTTP 클라이언트 사용)
  entities: base44Original.entities,
  auth: base44Original.auth,
  // HTTP 클라이언트에 오프라인 지원 추가
  _http: base44Original._http
    ? createOfflineWrapper(base44Original._http)
    : null,
};

// 기존 base44 클라이언트도 export (호환성)
export const base44Client = base44;
