// import { createClient } from "@base44/sdk";
// import { createOfflineWrapper } from "./offlineWrapper";
import { localClient } from "./localClient";
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// 로컬 전용 모드: Base44 API 없이 IndexedDB만 사용
// 인증이나 네트워크 연결 없이 완전히 독립적으로 작동
console.log("🏠 로컬 전용 모드로 실행 중");

// 로컬 클라이언트 사용
export const base44 = localClient;

// 기존 base44 클라이언트도 export (호환성)
export const base44Client = localClient;
