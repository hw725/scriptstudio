import { createClient } from "@base44/sdk";
import { createOfflineWrapper } from "./offlineWrapper";
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Base44 클라이언트 생성
// 앱 ID를 확인하세요: https://base44.co → Apps → Settings
const base44Original = createClient({
  appId: "686c833faa6ba9f57e0dbbba",
  requiresAuth: true, // 인증 필요 - 로그인 페이지가 나타남
});

console.log("🌐 Base44 연결 시도 중... (인증 필요)");

// 오프라인 지원으로 래핑
export const base44 = {
  ...base44Original,
  entities: base44Original.entities,
  auth: base44Original.auth,
  _http: base44Original._http
    ? createOfflineWrapper(base44Original._http)
    : null,
};

// 기존 base44 클라이언트도 export (호환성)
export const base44Client = base44;
