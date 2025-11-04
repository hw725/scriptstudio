import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import { initDB } from "@/db/localDB";

// IndexedDB 초기화
initDB().catch(console.error);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
