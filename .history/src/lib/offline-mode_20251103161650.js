// Offline/online mode utility
// Priority: localStorage override > env default

const STORAGE_KEY = "scriptstudio_offline_mode";

function parseBool(val, fallback) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const v = val.toLowerCase().trim();
    if (v === "true" || v === "1" || v === "yes" || v === "y") return true;
    if (v === "false" || v === "0" || v === "no" || v === "n") return false;
  }
  return fallback;
}

export function getEnvDefaultOfflineMode() {
  try {
    // default false unless explicitly true
    const raw = import.meta?.env?.VITE_OFFLINE_MODE ?? "false";
    return parseBool(String(raw), false);
  } catch {
    return false;
  }
}

export function getOfflineMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored != null) return parseBool(stored, getEnvDefaultOfflineMode());
  } catch {
    // ignore storage errors
  }
  return getEnvDefaultOfflineMode();
}

export function setOfflineMode(flag) {
  try {
    localStorage.setItem(STORAGE_KEY, String(!!flag));
    // ensure a clean re-init
    window.location.reload();
  } catch {
    // fallback: still reload
    window.location.reload();
  }
}

// expose for quick manual toggling in console
if (typeof window !== "undefined") {
  window.__scriptstudio_offline_get = getOfflineMode;
  window.__scriptstudio_offline_set = setOfflineMode;
}
