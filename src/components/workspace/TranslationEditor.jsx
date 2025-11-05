import React, { useState, useEffect, useCallback, useRef } from "react";
import { Note } from "@/api/entities";
import Editor from "./Editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  ArrowLeftRight,
  FileText,
  Languages,
  PenSquare,
  Eye,
} from "lucide-react";
import { useData } from "@/components/providers/DataProvider";
// import PomoFlowPanel from "./PomoFlowPanel"; // Edge Function 필요 - 제거됨

const ResizableHandle = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className="absolute left-1/2 top-0 h-full w-2 cursor-col-resize z-10 flex items-center justify-center group hover:bg-blue-100 transition-colors -translate-x-1/2"
  >
    <GripVertical className="h-6 w-3 text-slate-300 group-hover:text-primary transition-colors" />
  </div>
);

export default function TranslationEditor({
  sourceNoteId,
  onNavigateToNote,
  onExitTranslationMode,
}) {
  const { allNotes, refetchData } = useData();
  const [sourceNote, setSourceNote] = useState(null);
  const [translationNote, setTranslationNote] = useState(null);
  const [activePanel, setActivePanel] = useState("translation"); // 'source' or 'translation'
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [isCreatingTranslation, setIsCreatingTranslation] = useState(false);
  const [sourceReadMode, setSourceReadMode] = useState(true);

  // New states for line features
  const [sourceEnableLineHighlight, setSourceEnableLineHighlight] =
    useState(true);
  const [sourceEnableZebraStripes, setSourceEnableZebraStripes] =
    useState(false);
  const [translationEnableLineHighlight, setTranslationEnableLineHighlight] =
    useState(true);
  const [translationEnableZebraStripes, setTranslationEnableZebraStripes] =
    useState(false);

  const activePanelDebounceTimer = useRef(null);
  const containerRef = useRef(null);

  // 노트 로드
  useEffect(() => {
    const loadNotes = async () => {
      if (!sourceNoteId) return;

      const source = allNotes.find((n) => n.id === sourceNoteId);
      if (!source) return;

      setSourceNote(source);

      // translation_of_id로 연결된 번역 노트 찾기
      if (source.translation_of_id) {
        const translation = allNotes.find(
          (n) => n.id === source.translation_of_id
        );
        if (translation) {
          setTranslationNote(translation);
        }
      } else {
        // 역방향으로도 확인 (이 노트를 원본으로 가지는 번역 노트)
        const translation = allNotes.find(
          (n) => n.translation_of_id === sourceNoteId
        );
        if (translation) {
          setTranslationNote(translation);
        }
      }
    };

    loadNotes();
  }, [sourceNoteId, allNotes]);

  // 번역 노트 생성
  const handleCreateTranslation = async () => {
    if (!sourceNote || isCreatingTranslation) return;

    setIsCreatingTranslation(true);
    try {
      const newTranslation = await Note.create({
        title: `${sourceNote.title} (번역)`,
        content: "",
        project_id: sourceNote.project_id,
        folder_id: sourceNote.folder_id,
        translation_of_id: sourceNote.id,
        pomoflow_task_id: sourceNote.pomoflow_task_id || null, // 원문의 task_id 복사
      });

      // 원본 노트에도 번역 노트 ID 연결
      await Note.update(sourceNote.id, {
        translation_of_id: newTranslation.id,
      });

      await refetchData();
      setTranslationNote(newTranslation);
    } catch (error) {
      console.error("번역 노트 생성 실패:", error);
      alert("번역 노트를 생성하는 데 실패했습니다.");
    } finally {
      setIsCreatingTranslation(false);
    }
  };

  // 패널 전환 (디바운싱 적용)
  const handlePanelClick = useCallback((panel) => {
    if (activePanelDebounceTimer.current) {
      clearTimeout(activePanelDebounceTimer.current);
    }

    activePanelDebounceTimer.current = setTimeout(() => {
      setActivePanel(panel);
    }, 150);
  }, []);

  // 리사이징 핸들러
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth > 20 && newWidth < 80) {
        setLeftPanelWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // 패널 교체
  const handleSwapPanels = () => {
    setLeftPanelWidth(100 - leftPanelWidth);
  };

  // PomoFlow 관련 코드 제거됨
  // const linkedNote = sourceNote?.pomoflow_task_id ? sourceNote : translationNote?.pomoflow_task_id ? translationNote : sourceNote;

  if (!sourceNote) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <p className="text-slate-500">노트를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col relative bg-slate-100"
    >
      {/* 번역 모드 헤더 - 종료 버튼 포함 */}
      <div className="h-12 px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Languages className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-slate-800">번역 모드</h2>
          <Badge
            variant="outline"
            className="text-xs"
          >
            원문 ↔ 번역문
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapPanels}
            className="h-8 gap-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            패널 교체
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExitTranslationMode}
            className="h-8"
          >
            번역 모드 종료
          </Button>
        </div>
      </div>

      {/* 원문/번역문 패널 영역 */}
      <div className="flex-1 flex relative min-h-0">
        {/* 왼쪽 패널 */}
        <div
          style={{ width: `${leftPanelWidth}%` }}
          onClick={() => handlePanelClick("source")}
          className={`relative flex flex-col h-full transition-opacity ${
            activePanel === "source"
              ? "ring-2 ring-inset ring-primary/30"
              : "opacity-90"
          }`}
        >
          {/* 패널 헤더 */}
          <div className="h-10 flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">원문</span>
              {activePanel === "source" && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  활성
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSourceReadMode(!sourceReadMode);
                }}
                className="h-7 gap-1 text-xs"
              >
                {sourceReadMode ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <PenSquare className="h-3 w-3" />
                )}
                {sourceReadMode ? "읽기" : "편집"}
              </Button>

              {/* 원문 읽기 편의 옵션 (편집 모드에서만) */}
              {!sourceReadMode && (
                <>
                  <Button
                    variant={sourceEnableLineHighlight ? "secondary" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSourceEnableLineHighlight(!sourceEnableLineHighlight);
                    }}
                    className="h-6 w-6 p-0"
                    title="현재 줄 강조"
                  >
                    <span className="text-xs">줄</span>
                  </Button>
                  <Button
                    variant={sourceEnableZebraStripes ? "secondary" : "ghost"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSourceEnableZebraStripes(!sourceEnableZebraStripes);
                    }}
                    className="h-6 w-6 p-0"
                    title="교차 배경색"
                  >
                    <span className="text-xs">줄무늬</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 에디터 영역 */}
          <div className="flex-1 min-h-0 translation-source-panel">
            <EditorWithLineFeatures
              note={sourceNote}
              onNavigateToNote={onNavigateToNote}
              isReadMode={sourceReadMode}
              enableLineHighlight={sourceEnableLineHighlight}
              enableZebraStripes={sourceEnableZebraStripes}
              panelId="source"
            />
          </div>
        </div>

        {/* 리사이징 핸들 */}
        <ResizableHandle onMouseDown={handleMouseDown} />

        {/* 오른쪽 패널 */}
        <div
          style={{ width: `${100 - leftPanelWidth}%` }}
          onClick={() => handlePanelClick("translation")}
          className={`relative flex flex-col h-full transition-opacity ${
            activePanel === "translation"
              ? "ring-2 ring-inset ring-primary/30"
              : "opacity-90"
          }`}
        >
          {/* 패널 헤더 */}
          <div className="h-10 flex-shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-slate-700">번역</span>
              {activePanel === "translation" && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  활성
                </span>
              )}
            </div>

            {/* 번역문 읽기 편의 옵션 */}
            {translationNote && (
              <div className="flex items-center gap-1">
                <Button
                  variant={
                    translationEnableLineHighlight ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTranslationEnableLineHighlight(
                      !translationEnableLineHighlight
                    );
                  }}
                  className="h-6 w-6 p-0"
                  title="현재 줄 강조"
                >
                  <span className="text-xs">줄</span>
                </Button>
                <Button
                  variant={
                    translationEnableZebraStripes ? "secondary" : "ghost"
                  }
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTranslationEnableZebraStripes(
                      !translationEnableZebraStripes
                    );
                  }}
                  className="h-6 w-6 p-0"
                  title="교차 배경색"
                >
                  <span className="text-xs">줄무늬</span>
                </Button>
              </div>
            )}
          </div>

          {/* 에디터 영역 */}
          <div className="flex-1 min-h-0 translation-translation-panel">
            {translationNote ? (
              <EditorWithLineFeatures
                note={translationNote}
                onNavigateToNote={onNavigateToNote}
                isReadMode={false}
                enableLineHighlight={translationEnableLineHighlight}
                enableZebraStripes={translationEnableZebraStripes}
                panelId="translation"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-white p-8">
                <Languages className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  번역 노트가 없습니다
                </h3>
                <p className="text-slate-500 text-center mb-6 max-w-md">
                  이 원문 노트에 연결된 번역 노트를 생성하여 원문과 번역문을
                  나란히 보면서 작업할 수 있습니다.
                </p>
                <Button
                  onClick={handleCreateTranslation}
                  disabled={isCreatingTranslation}
                  className="gap-2"
                >
                  <Languages className="h-4 w-4" />
                  {isCreatingTranslation ? "생성 중..." : "번역 노트 생성"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PomoFlow Panel - Edge Function 필요로 제거됨 */}

      <style>{`
        /* 번역 모드 전용 스타일 - 패널별로 독립적으로 적용 */
        .translation-source-panel .ql-editor > .current-line,
        .translation-translation-panel .ql-editor > .current-line {
          background-color: rgba(34, 197, 94, 0.08) !important;
          border-left: 3px solid rgba(34, 197, 94, 0.5);
          padding-left: 1rem !important;
          margin-left: -1rem;
          transition: all 0.15s ease;
        }
        
        .translation-source-panel .ql-editor > .zebra-even,
        .translation-translation-panel .ql-editor > .zebra-even {
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        .translation-source-panel .ql-editor > .zebra-odd,
        .translation-translation-panel .ql-editor > .zebra-odd {
          background-color: transparent;
        }
        
        /* Ensure current line highlighting takes precedence over zebra stripes */
        .translation-source-panel .ql-editor > .current-line.zebra-even,
        .translation-source-panel .ql-editor > .current-line.zebra-odd,
        .translation-translation-panel .ql-editor > .current-line.zebra-even,
        .translation-translation-panel .ql-editor > .current-line.zebra-odd {
          background-color: rgba(34, 197, 94, 0.08) !important;
        }
      `}</style>
    </div>
  );
}

// 줄 강조 기능이 있는 Editor 래퍼 컴포넌트
function EditorWithLineFeatures({
  note,
  onNavigateToNote,
  isReadMode,
  enableLineHighlight,
  enableZebraStripes,
  panelId: _panelId,
}) {
  const quillRef = useRef(null);

  // Current line highlight logic
  useEffect(() => {
    // If in read mode or quillRef is not ready, ensure no highlighting classes are active
    if (isReadMode || !quillRef.current) {
      if (quillRef.current) {
        const editorRoot = quillRef.current.getEditor()?.root;
        if (editorRoot) {
          const allLines = editorRoot.querySelectorAll(".ql-editor > *");
          allLines.forEach((el) => el.classList.remove("current-line"));
        }
      }
      return;
    }

    const quill = quillRef.current.getEditor();
    if (!quill) return;

    const updateCurrentLine = () => {
      const selection = quill.getSelection();
      const editorRoot = quill.root;

      // Always remove 'current-line' from all elements first to prevent multiple highlights
      const allLines = editorRoot.querySelectorAll(".ql-editor > *");
      allLines.forEach((el) => el.classList.remove("current-line"));

      if (enableLineHighlight && selection && selection.length === 0) {
        // Only highlight if no text is selected (cursor only)
        const [line] = quill.getLine(selection.index);
        if (line && line.domNode) {
          line.domNode.classList.add("current-line");
        }
      }
    };

    // Listen for selection changes to update the highlighted line
    quill.on("selection-change", updateCurrentLine);
    updateCurrentLine(); // Call once initially to set the state based on initial cursor position

    return () => {
      quill.off("selection-change", updateCurrentLine);
      // Clean up classes when component unmounts or dependencies change
      const editorRoot = quill.root;
      if (editorRoot) {
        const allLines = editorRoot.querySelectorAll(".ql-editor > *");
        allLines.forEach((el) => el.classList.remove("current-line"));
      }
    };
  }, [isReadMode, enableLineHighlight, note.content]); // Re-run if note content changes, as DOM structure might change

  // Zebra stripes logic
  useEffect(() => {
    // If in read mode or quillRef is not ready, ensure no zebra classes are active
    if (isReadMode || !quillRef.current) {
      if (quillRef.current) {
        const editorRoot = quillRef.current.getEditor()?.root;
        if (editorRoot) {
          const allLines = editorRoot.querySelectorAll(".ql-editor > *");
          allLines.forEach((el) =>
            el.classList.remove("zebra-even", "zebra-odd")
          );
        }
      }
      return;
    }

    const quill = quillRef.current.getEditor();
    if (!quill) return;

    const editorRoot = quill.root;
    const allLines = editorRoot.querySelectorAll(".ql-editor > *");

    allLines.forEach((el, index) => {
      if (enableZebraStripes) {
        el.classList.toggle("zebra-even", index % 2 === 0);
        el.classList.toggle("zebra-odd", index % 2 === 1);
      } else {
        el.classList.remove("zebra-even", "zebra-odd");
      }
    });

    // Cleanup: remove classes if enableZebraStripes becomes false or component unmounts
    return () => {
      if (editorRoot) {
        allLines.forEach((el) =>
          el.classList.remove("zebra-even", "zebra-odd")
        );
      }
    };
  }, [note.content, enableZebraStripes, isReadMode]); // Re-run if note content changes or feature is toggled

  return (
    <div className="h-full">
      <Editor
        ref={quillRef} // Assuming Editor component accepts a ref and exposes getEditor() on it
        note={note}
        onNavigateToNote={onNavigateToNote}
        isReadMode={isReadMode}
      />
    </div>
  );
}
