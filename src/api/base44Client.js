import { localClient } from "./localClient";
import { supabaseClient } from "./supabaseClient";
import { createOfflineWrapper } from "./offlineWrapper";
import { getOfflineMode } from "@/lib/offline-mode";

/**
 * 🔥 하이브리드 클라이언트 - 오프라인/온라인 자동 전환
 *
 * 오프라인 모드 (VITE_OFFLINE_MODE=true):
 *   - 100% 로컬 IndexedDB만 사용
 *   - 네트워크 요청 없음
 *
 * 온라인 모드 (VITE_OFFLINE_MODE=false):
 *   - Supabase 백엔드 사용
 *   - 자동 로컬 캐싱
 *   - 오프라인 시 로컬 데이터 사용
 *   - 온라인 복귀 시 자동 동기화
 */

const OFFLINE = getOfflineMode();

let client;

if (OFFLINE) {
  // 완전 오프라인 모드 - 로컬만 사용
  console.info("📦 로컬 전용 모드 활성화");
  client = localClient;
} else {
  // 온라인 모드 - Supabase + 오프라인 지원
  console.info("🌐 온라인 모드 활성화 (Supabase + 오프라인 지원)");
  client = createOfflineWrapper(supabaseClient);
}

export const base44 = client;
export const base44Client = client;
export default client;

// 콘솔에서 모드 전환: window.__scriptstudio_offline_set(true/false)
// 현재 모드 확인: window.__scriptstudio_offline_get()
