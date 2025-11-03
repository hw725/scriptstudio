import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useData } from "@/components/providers/DataProvider";
import Binder from "@/components/workspace/Binder";
import Editor from "@/components/workspace/Editor";
import {
  WelcomeScreen,
  LoadingScreen,
} from "@/components/workspace/Placeholders";
import Corkboard from "@/components/workspace/Corkboard";
import ProgressTracker from "@/components/workspace/ProgressTracker";
import ProjectSelector from "@/components/workspace/ProjectSelector";
import ReferenceViewer from "@/components/workspace/ReferenceViewer";
import OutlineView from "@/components/workspace/OutlineView";
import SyncStatusBadge from "@/components/workspace/SyncStatusBadge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import NewNoteModal from "./NewNoteModal";
import DailyNotesView from "./DailyNotesView";
import TranslationEditor from "./TranslationEditor"; // New import

export default function WorkspacePage() {
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedReferenceId, setSelectedReferenceId] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState("editor");
  const [showProgress, setShowProgress] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNoteFolderId, setNewNoteFolderId] = useState(null);
  const [isTranslationMode, setIsTranslationMode] = useState(false); // New state variable

  // 번역 모드 진입 전 상태 저장
  const [preTranslationState, setPreTranslationState] = useState(null); // New state variable

  const {
    notes,
    folders,
    references,
    projects,
    currentProject,
    setCurrentProject,
    isLoading,
    refetchData,
    allNotes,
  } = useData();

  const handleSelectNote = useCallback(
    (noteId, isInitialLoad = false) => {
      const targetNote = allNotes.find((n) => n.id === noteId);

      if (targetNote) {
        // 선택된 노트의 프로젝트가 현재 프로젝트와 다르면 프로젝트를 전환
        if (targetNote.project_id !== currentProject?.id) {
          if (targetNote.project_id) {
            const targetProject = projects.find(
              (p) => p.id === targetNote.project_id
            );
            if (targetProject) {
              setCurrentProject(targetProject);
            }
          } else {
            setCurrentProject(null);
          }
        }
      }

      setViewMode("editor");
      setSelectedReferenceId(null);
      setSelectedNoteId(noteId);
      setIsTranslationMode(false); // Reset translation mode when a new note is selected
    },
    [allNotes, projects, currentProject, setCurrentProject]
  );

  // URL 파라미터 확인하여 자동 선택 (초기 로딩 시 1회만)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteIdFromUrl = urlParams.get("noteId");
    if (noteIdFromUrl) {
      handleSelectNote(noteIdFromUrl, true);
      // URL에서 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleSelectNote]); // handleSelectNote를 의존성 배열에 추가

  // 데이터가 변경될 때 선택된 항목이 여전히 존재하는지 확인
  useEffect(() => {
    if (selectedNoteId && !allNotes.some((n) => n.id === selectedNoteId)) {
      setSelectedNoteId(null);
    }
    if (
      selectedReferenceId &&
      !references.some((r) => r.id === selectedReferenceId)
    ) {
      setSelectedReferenceId(null);
    }
  }, [allNotes, references, selectedNoteId, selectedReferenceId]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return allNotes.find((n) => n.id === selectedNoteId);
  }, [selectedNoteId, allNotes]);

  const handleShowNewNoteModal = (folderId = null) => {
    setNewNoteFolderId(folderId);
    setShowNewNoteModal(true);
  };

  const handleViewItem = (itemId, itemType) => {
    if (itemType === "reference") {
      const referenceExists = references.some((r) => r.id === itemId);
      if (!referenceExists) {
        console.warn("참고문헌이 존재하지 않습니다:", itemId);
        refetchData();
        return;
      }

      setViewMode("editor");
      setSelectedNoteId(null);
      setSelectedReferenceId(itemId);
    }
  };

  const handleCreateNewNote = (newNote) => {
    refetchData().then(() => {
      handleSelectNote(newNote.id); // 새 노트 선택 로직 통합
      setShowNewNoteModal(false);
    });
  };

  const handleToggleViewMode = () => {
    setViewMode((prev) => {
      const modes = ["editor", "corkboard", "outline", "daily"];
      const currentIndex = modes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % modes.length;
      const newMode = modes[nextIndex];

      if (newMode !== "editor") {
        setSelectedNoteId(null);
        setSelectedReferenceId(null);
      }
      return newMode;
    });
  };

  // 번역 모드 진입
  const handleEnterTranslationMode = useCallback(
    (noteId) => {
      // 현재 상태 저장
      setPreTranslationState({
        sidebarCollapsed,
        showProgress,
        viewMode,
      });

      // 번역 모드 설정
      setSelectedNoteId(noteId);
      setIsTranslationMode(true);
      setSidebarCollapsed(true);
      setShowProgress(false);
      setViewMode("translation"); // Ensure viewMode is set to 'translation'
    },
    [sidebarCollapsed, showProgress, viewMode]
  );

  // 번역 모드 종료
  const handleExitTranslationMode = useCallback(() => {
    setIsTranslationMode(false);

    // 이전 상태 복원
    if (preTranslationState) {
      setSidebarCollapsed(preTranslationState.sidebarCollapsed);
      setShowProgress(preTranslationState.showProgress);
      setViewMode(preTranslationState.viewMode);
      setPreTranslationState(null);
    }
  }, [preTranslationState]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      {/* 동기화 상태 표시 (상단에 고정) */}
      <div className="h-12 px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("Dashboard")}>
            <Button
              variant="ghost"
              size="icon"
              title="대시보드로 이동"
              className="h-6 w-6"
            >
              <LayoutDashboard className="h-4 w-4 text-primary/80" />
            </Button>
          </Link>
          {!isTranslationMode && (
            <div className="flex-1 min-w-0">
              <ProjectSelector />
            </div>
          )}
        </div>
        <SyncStatusBadge />
      </div>

      <div className="flex flex-1 min-h-0">
        {!isTranslationMode && ( // Sidebar and its header are hidden in translation mode
          <div className="flex flex-col h-full shrink-0">
            <Binder
              notes={notes}
              folders={folders}
              references={references}
              onSelectNote={handleSelectNote}
              selectedNoteId={selectedNoteId}
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
              width={sidebarWidth} // 너비 전달
              setWidth={setSidebarWidth} // 너비 설정 함수 전달
              onShowNewNoteModal={handleShowNewNoteModal}
              onViewItem={handleViewItem}
              onToggleViewMode={handleToggleViewMode}
              viewMode={viewMode}
              currentProject={currentProject}
              refetchData={refetchData}
              projects={projects}
              onEnterTranslationMode={handleEnterTranslationMode} // New prop
            />
          </div>
        )}

        <main className="flex-1 min-w-0 transition-all duration-300">
          {isTranslationMode ? ( // Render TranslationEditor when in translation mode
            <TranslationEditor
              sourceNoteId={selectedNoteId}
              onNavigateToNote={handleSelectNote}
              onExitTranslationMode={handleExitTranslationMode}
            />
          ) : viewMode === "corkboard" ? (
            <Corkboard
              notes={notes}
              folders={folders}
              onSelectNote={handleSelectNote}
              onShowNewNoteModal={handleShowNewNoteModal}
            />
          ) : viewMode === "outline" ? (
            <OutlineView
              notes={notes}
              folders={folders}
              onSelectNote={handleSelectNote}
              selectedNoteId={selectedNoteId}
              currentProject={currentProject}
              refetchData={refetchData}
              onShowNewNoteModal={handleShowNewNoteModal}
            />
          ) : viewMode === "daily" ? (
            <DailyNotesView
              notes={allNotes} // 일간 노트는 전체 노트 기반으로
              onSelectNote={handleSelectNote}
              onShowNewNoteModal={handleShowNewNoteModal}
            />
          ) : selectedNote ? (
            <Editor
              key={selectedNote.id}
              note={selectedNote}
              onNavigateToNote={handleSelectNote} // 네비게이션 함수 전달
              onEnterTranslationMode={handleEnterTranslationMode}
            />
          ) : selectedReferenceId ? (
            <ReferenceViewer
              key={selectedReferenceId}
              referenceId={selectedReferenceId}
            />
          ) : (
            <WelcomeScreen />
          )}
        </main>

        {!isTranslationMode && ( // ProgressTracker is hidden in translation mode
          <ProgressTracker
            notes={notes}
            isVisible={showProgress}
            onToggle={() => setShowProgress(!showProgress)}
            currentProject={currentProject}
          />
        )}
      </div>

      <NewNoteModal
        isOpen={showNewNoteModal}
        onClose={() => setShowNewNoteModal(false)}
        folderId={newNoteFolderId}
        onNoteCreated={handleCreateNewNote}
      />
    </div>
  );
}
