import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderOpen,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { format, isToday, isYesterday, subDays } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notes,
    projects,
    folders,
    refetchData,
    isLoading: dataLoading,
    error,
  } = useData();
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalProjects: 0,
    totalFolders: 0,
    recentNotes: [],
  });
  // 초기 데이터 새로고침 (있으면)
  useEffect(() => {
    if (typeof refetchData === "function") {
      refetchData();
    }
  }, [refetchData]);

  useEffect(() => {
    if (!notes || !projects || !folders) return;

    const sevenDaysAgo = subDays(new Date(), 7).getTime();
    const recentNotes = notes
      .filter((note) => {
        const updated = new Date(
          note.updated_date || note.created_date
        ).getTime();
        return updated >= sevenDaysAgo;
      })
      .sort((a, b) => {
        const aTime = new Date(a.updated_date || a.created_date).getTime();
        const bTime = new Date(b.updated_date || b.created_date).getTime();
        return bTime - aTime;
      })
      .slice(0, 5);

    setStats({
      totalNotes: notes.length,
      totalProjects: projects.length,
      totalFolders: folders.length,
      recentNotes,
    });
  }, [notes, projects, folders]);

  const getRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isToday(date)) return "오늘";
    if (isYesterday(date)) return "어제";
    return format(date, "M월 d일");
  };

  const handleNoteClick = (note) => {
    if (!note || !note.id) {
      toast({
        title: "오류",
        description: "노트 정보를 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/workspace?noteId=${note.id}`);
  };

  const handleNewNote = () => {
    navigate("/workspace");
  };

  const handleGoToWorkspace = () => {
    navigate("/workspace");
  };

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center text-slate-700">
          <p className="mb-3">대시보드를 불러오는 중 오류가 발생했습니다.</p>
          <p className="text-sm text-slate-500 mb-6">{String(error)}</p>
          <Button
            onClick={() => refetchData?.()}
            variant="outline"
          >
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
              대시보드
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              프로젝트와 노트를 한눈에 확인하세요
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button
              onClick={handleNewNote}
              size="default"
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">새 노트</span>
            </Button>
            <Button
              onClick={handleGoToWorkspace}
              size="default"
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">작업 공간</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                전체 노트
              </CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalNotes}
              </div>
              <p className="text-xs text-slate-500 mt-1">작성된 노트 수</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                프로젝트
              </CardTitle>
              <FolderOpen className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalProjects}
              </div>
              <p className="text-xs text-slate-500 mt-1">진행 중인 프로젝트</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                폴더
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats.totalFolders}
              </div>
              <p className="text-xs text-slate-500 mt-1">구성된 폴더</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                <CardTitle className="text-base sm:text-lg">
                  최근 작업한 노트
                </CardTitle>
              </div>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 text-xs w-fit"
              >
                최근 7일
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentNotes.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-slate-500 mb-3 sm:mb-4">
                  최근 작업한 노트가 없습니다
                </p>
                <Button
                  onClick={handleNewNote}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />첫 노트 작성하기
                </Button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {stats.recentNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note)}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                          {note.title || "제목 없음"}
                        </h3>
                        <div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1">
                          <span className="text-xs text-slate-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {getRelativeTime(
                              note.updated_date || note.created_date
                            )}
                          </span>
                          {note.status && (
                            <Badge
                              variant="outline"
                              className="text-xs h-5 px-2 hidden sm:inline-flex"
                            >
                              {note.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                  빠른 시작
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  새로운 노트를 작성하거나 작업 공간으로 이동하세요
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button
                  onClick={handleNewNote}
                  size="default"
                  className="bg-blue-600 hover:bg-blue-700 shadow-md flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="text-sm sm:text-base">노트 작성</span>
                </Button>
                <Button
                  onClick={handleGoToWorkspace}
                  size="default"
                  variant="outline"
                  className="shadow-sm flex-1 sm:flex-none"
                >
                  <span className="text-sm sm:text-base">작업 공간</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
