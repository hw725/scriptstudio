// import { createClient } from "@base44/sdk";
// import { createOfflineWrapper } from "./offlineWrapper";
import { localClient } from "./localClient";
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Base44 앱이 Production에 배포되지 않아 404 발생
// 로컬 전용 모드로 전환
console.log("� 로컬 전용 모드 (Base44 비활성화)");

export const base44 = localClient;
export const base44Client = localClient;
