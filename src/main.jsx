import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import { initDB } from "@/db/localDB";
// Expose backup import helper to window (and enable optional hotkey)
import "@/lib/import-backup.js";

// IndexedDB 초기화
initDB().catch(console.error);

// Optional: Ctrl+Alt+I to import a backup JSON without using DevTools console
if (typeof window !== "undefined") {
  window.addEventListener("keydown", async (e) => {
    // Ctrl+Alt+I (or Cmd+Alt+I on macOS)
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (isCtrlOrCmd && e.altKey && (e.key === "I" || e.key === "i")) {
      try {
        e.preventDefault();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.onchange = async (ev) => {
          const file = ev.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          const json = JSON.parse(text);
          const fn = window?.ScriptStudio?.importBackupJSON;
          if (typeof fn !== "function") {
            alert("Import function is not available.");
            return;
          }
          const report = await fn(json, { mode: "upsert" });
          console.log("Import report:", report);
          alert("Import finished. See console for report.");
        };
        input.click();
      } catch (err) {
        console.error("Backup import failed:", err);
        alert("Backup import failed: " + (err?.message || String(err)));
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
