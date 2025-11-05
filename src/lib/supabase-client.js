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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
