/* global process */
import { createClient } from "@supabase/supabase-js";

// Handle both Vite (import.meta.env) and Node.js (process.env) environments safely
const getEnvVar = (key, defaultValue) => {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env[key] !== undefined
  ) {
    return import.meta.env[key];
  }
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env[key] !== undefined
  ) {
    return process.env[key];
  }
  return defaultValue;
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL", "http://127.0.0.1:54321");
const supabaseAnonKey = getEnvVar(
  "VITE_SUPABASE_ANON_KEY",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: "sb-celspwnmirsebfzbyopr-auth-token",
    flowType: "pkce",
  },
});

// 디버깅: 클라이언트 생성 확인
console.log("🔧 Supabase Client 생성:", {
  supabaseUrl,
  anonKeyPrefix: supabaseAnonKey.slice(0, 20) + "...",
  storageKey: "sb-celspwnmirsebfzbyopr-auth-token",
});

// 세션 즉시 확인
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log(
    "🔧 Client 생성 직후 세션:",
    session ? "있음" : "없음",
    session?.user?.id
  );
});

// 전역 노출 (디버깅용)
if (typeof window !== "undefined") {
  window.supabase = supabase;
  console.log("🌍 window.supabase 노출 완료");
}
