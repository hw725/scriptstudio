import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Loader2 } from "lucide-react";

export default function ImportBackupButton({
  variant = "ghost",
  size = "default",
  className = "",
}) {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleClick = () => {
    if (isImporting) return;
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const summarizeReport = (report) => {
    if (!report || typeof report !== "object")
      return "가져오기가 완료되었습니다.";
    const entries = Object.entries(report);
    let created = 0,
      updated = 0,
      errors = 0;
    for (const [, v] of entries) {
      if (v && typeof v === "object") {
        created += v.created || 0;
        updated += v.updated || 0;
        errors += v.errors || 0;
      }
    }
    const parts = [];
    parts.push(`생성 ${created}건`);
    parts.push(`업데이트 ${updated}건`);
    if (errors > 0) parts.push(`에러 ${errors}건`);
    return parts.join(", ");
  };

  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-selecting same file next time
    if (!file) return;
    try {
      setIsImporting(true);
      toast({
        title: "백업 가져오기 시작",
        description: `${file.name} 파일을 처리 중입니다…`,
      });

      const text = await file.text();
      const json = JSON.parse(text);
      let fn = window?.ScriptStudio?.importBackupJSON;
      if (typeof fn !== "function") {
        try {
          const mod = await import("@/lib/import-backup.js");
          fn = mod?.importBackupJSON;
          if (typeof fn === "function") {
            // cache on window for subsequent calls
            window.ScriptStudio = window.ScriptStudio || {};
            window.ScriptStudio.importBackupJSON = fn;
          }
        } catch (_err) {
          // fallthrough; will show a friendly error below
        }
      }
      if (typeof fn !== "function") {
        throw new Error("가져오기 모듈을 불러올 수 없습니다.");
      }
      const report = await fn(json, { mode: "upsert" });

      // success toast
      toast({
        title: "백업 가져오기 완료",
        description: summarizeReport(report),
      });
      // optional: console log full report
      console.log("Import report:", report);
      // trigger a light haptic via vibration API (if available)
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (err) {
      console.error("Backup import failed:", err);
      toast({
        title: "가져오기 실패",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onFileChange}
      />
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 mr-3 animate-spin" />
        ) : (
          <UploadCloud className="h-4 w-4 mr-3" />
        )}
        {isImporting ? "가져오는 중…" : "백업 가져오기"}
      </Button>
    </>
  );
}
