/* eslint react-refresh/only-export-components: off */
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { Note } from "@/api/entities";
import { Folder } from "@/api/entities";
import { Reference } from "@/api/entities";
import { Project } from "@/api/entities";
import { syncManager } from "@/sync/syncManager";
import { initDB } from "@/db/localDB";
import { initSampleData } from "@/db/initSampleData";
import client from "@/api/base44Client";

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [references, setReferences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null);

  // 동기화 상태 업데이트
  useEffect(() => {
    const handleSyncStatus = async () => {
      const status = await syncManager.getSyncStatus();
      setSyncStatus(status);
    };

    // 온라인/오프라인 상태 리스너
    const statusListener = (status) => {
      setIsOnline(status === "online");
      handleSyncStatus();
    };

    syncManager.addListener(statusListener);
    handleSyncStatus();

    return () => {
      syncManager.removeListener(statusListener);
    };
  }, []);

  // IndexedDB 초기화 및 자동 동기화 시작
  useEffect(() => {
    const init = async () => {
      try {
        // IndexedDB 초기화
        await initDB();
        console.log("✅ IndexedDB 초기화 완료");

        // syncManager에 API 클라이언트 설정
        syncManager.setApiClient(client);
        console.log("✅ syncManager API 클라이언트 설정 완료");

        // 샘플 데이터 초기화 (처음 실행 시)
        await initSampleData();

        // 자동 동기화 시작 (30초마다) - 로컬 모드에서는 비활성화됨
        syncManager.startAutoSync(30000);
        console.log("✅ 자동 동기화 시작");
      } catch (err) {
        console.error("❌ 초기화 실패:", err);
      }
    };

    init();

    return () => {
      // 컴포넌트 언마운트 시 자동 동기화 중지
      syncManager.stopAutoSync();
      console.log("⏹️ 자동 동기화 중지");
    };
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projectsData, notesData, foldersData, referencesData] =
        await Promise.all([
          Project.list("-created_date"),
          Note.list("-created_date"),
          Folder.list("-created_date"),
          Reference.list("-created_date"),
        ]);

      const safeProjects = projectsData || [];
      setProjects(safeProjects);
      setNotes(notesData || []);
      setFolders(foldersData || []);
      setReferences(referencesData || []);

      // 현재 선택된 프로젝트가 더 이상 존재하지 않는 경우 처리
      if (
        currentProject &&
        !safeProjects.some((p) => p.id === currentProject.id)
      ) {
        setCurrentProject(safeProjects.length > 0 ? safeProjects[0] : null);
      } else if (!currentProject && safeProjects.length > 0) {
        // 프로젝트가 있는데 선택된 것이 없으면 첫 번째 프로젝트를 선택
        setCurrentProject(safeProjects[0]);
      }
    } catch (err) {
      console.error("데이터 로드 중 오류:", err);
      if (
        err.message &&
        (err.message.includes("429") ||
          err.message.includes("Rate limit exceeded"))
      ) {
        setError("요청이 너무 많습니다. 잠시 후 페이지를 새로고침 해주세요.");
      } else {
        setError(
          "데이터를 불러오는 데 실패했습니다. 네트워크 연결을 확인해주세요."
        );
      }
      setNotes([]);
      setFolders([]);
      setReferences([]);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateNoteInState = (updatedNote) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n))
    );
  };

  const updateReferenceInState = (updatedReference) => {
    setReferences((prev) =>
      prev.map((r) =>
        r.id === updatedReference.id ? { ...r, ...updatedReference } : r
      )
    );
  };

  // 현재 프로젝트에 따라 필터링된 데이터
  const filteredNotes = currentProject
    ? notes.filter((note) => note.project_id === currentProject.id)
    : notes; // "전체 문서"일 때는 모든 문서 표시

  const filteredFolders = currentProject
    ? folders.filter((folder) => folder.project_id === currentProject.id)
    : folders; // "전체 문서"일 때는 모든 폴더 표시 (변경됨)

  const value = {
    notes: filteredNotes,
    folders: filteredFolders,
    references, // 참고문헌은 프로젝트와 무관하게 전체 표시
    projects,
    currentProject,
    setCurrentProject,
    isLoading,
    error,
    refetchData: fetchData,
    updateNoteInState,
    updateReferenceInState,
    // 원본 데이터도 제공 (프로젝트 삭제 시 필요)
    allNotes: notes,
    allFolders: folders,
    // 오프라인 지원 관련
    isOnline,
    syncStatus,
    syncManager, // 동기화 매니저 직접 접근
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
