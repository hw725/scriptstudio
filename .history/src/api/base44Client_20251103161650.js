// import { createClient } from "@base44/sdk";
// import { createOfflineWrapper } from "./offlineWrapper";
import { localClient } from "./localClient";
import { getOfflineMode } from "@/lib/offline-mode";
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// 현재 기본값: 오프라인(local) 모드. 온라인 모드는 나중에 원격 API를 연결하면 사용.
const OFFLINE = getOfflineMode();

let client = localClient;

if (!OFFLINE) {
  // TODO: 온라인 모드 구현 지점
  // - @base44/sdk 또는 실제 서버 API 클라이언트를 생성하고
  // - createOfflineWrapper(...)로 래핑하여 자동 캐시/동기화 지원
  // 예: const sdk = createClient({ baseUrl, token });
  //     client = createOfflineWrapper(sdk);
  console.info(
    "ℹ️ 온라인 모드가 선택되었지만, 아직 원격 API 클라이언트가 연결되지 않았습니다. 로컬 모드로 대체합니다."
  );
}

export const base44 = client;
export const base44Client = client;

// 런타임 전환은 window.__scriptstudio_offline_set(true/false)로 설정 후 페이지 리로드
