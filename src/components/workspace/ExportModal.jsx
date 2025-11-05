import React, { useState } from "react";
import { useData } from "@/components/providers/DataProvider";
import { Note, Folder, Project } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Code, File, Image } from "lucide-react";

const formatOptions = [
  {
    value: "markdown",
    label: "Markdown (.md)",
    icon: <FileText className="h-4 w-4" />,
    description: "다른 에디터에서 사용하기 좋은 범용 포맷",
  },
  {
    value: "html",
    label: "HTML (.html)",
    icon: <Code className="h-4 w-4" />,
    description: "웹브라우저에서 열 수 있는 포맷",
  },
  {
    value: "txt",
    label: "Plain Text (.txt)",
    icon: <File className="h-4 w-4" />,
    description: "가장 호환성이 좋은 텍스트 포맷",
  },
  {
    value: "pdf",
    label: "PDF (.pdf)",
    icon: <Image className="h-4 w-4" />,
    description: "인쇄용, 공유용 포맷",
  },
  {
    value: "json",
    label: "JSON (.json)",
    icon: <Code className="h-4 w-4" />,
    description: "모든 메타데이터 포함 백업용",
  },
];

const projectFormatOptions = [
  {
    value: "json",
    label: "JSON 백업",
    description: "프로젝트 전체 백업 (복원 가능)",
  },
  {
    value: "markdown_zip",
    label: "Markdown 모음",
    description: "모든 문서를 마크다운으로 내보내기",
  },
];

export default function ExportModal({ isOpen, onClose, noteId = null }) {
  const { projects, currentProject } = useData();
  const [exportType, setExportType] = useState(noteId ? "note" : "project");
  const [format, setFormat] = useState("markdown");
  const [selectedProject, setSelectedProject] = useState(
    currentProject?.id || "all"
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let exportData;

      if (exportType === "note" && noteId) {
        // 단일 노트 내보내기
        const note = await Note.get(noteId);
        exportData = {
          notes: [note],
          exported_at: new Date().toISOString(),
        };
      } else {
        // 프로젝트 전체 내보내기
        const projectFilter =
          selectedProject === "all" ? null : selectedProject;

        const allNotes = await Note.list();
        const allFolders = await Folder.list();
        const allProjects = await Project.list();

        const notes = projectFilter
          ? allNotes.filter((n) => n.project_id === projectFilter)
          : allNotes;

        const folders = projectFilter
          ? allFolders.filter((f) => f.project_id === projectFilter)
          : allFolders;

        const project = projectFilter
          ? allProjects.find((p) => p.id === projectFilter)
          : { title: "전체 문서" };

        exportData = {
          project,
          projects: projectFilter ? [project] : allProjects,
          folders,
          notes,
          exported_at: new Date().toISOString(),
        };
      }

      // JSON 문자열로 변환
      const jsonString = JSON.stringify(exportData, null, 2);

      // 파일 다운로드
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const timestamp = Date.now();
      const projectName =
        selectedProject === "all"
          ? "전체문서"
          : currentProject?.title || "프로젝트";
      a.download = `${projectName}-backup-${timestamp}.json`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      console.log("✅ 내보내기 완료:", a.download);
      alert("내보내기가 완료되었습니다! 다운로드 폴더를 확인하세요.");

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("내보내기에 실패했습니다: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const availableFormats =
    exportType === "project" ? projectFormatOptions : formatOptions;
  const selectedFormat = availableFormats.find((f) => f.value === format);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            내보내기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!noteId && (
            <div>
              <Label className="text-sm font-medium mb-3 block">
                내보내기 범위
              </Label>
              <RadioGroup
                value={exportType}
                onValueChange={setExportType}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="project"
                    id="project"
                  />
                  <Label htmlFor="project">프로젝트 전체</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {exportType === "project" && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                프로젝트 선택
              </Label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    🌐 모든 프로젝트 (전체 백업)
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                    >
                      📁 {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium mb-3 block">
              내보내기 형식
            </Label>
            <RadioGroup
              value={format}
              onValueChange={setFormat}
            >
              {availableFormats.map((option) => (
                <div
                  key={option.value}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      {option.icon}
                      {option.label}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedFormat && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedFormat.label}</strong>로 내보냅니다.
                <br />
                {selectedFormat.description}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? "내보내는 중..." : "내보내기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
