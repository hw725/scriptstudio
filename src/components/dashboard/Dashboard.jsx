import { useState, useEffect } from "react";
import { useData } from "@/components/providers/DataProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  FolderOpen,
  BookOpen,
  Plus,
  ArrowRight,
  Clock,
  Edit3,
  BarChart3,
  FileSignature,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isToday, isYesterday } from "date-fns";
import PomoFlowStats from "./PomoFlowStats";
import ImportBackupButton from "./ImportBackupButton.jsx";

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  color = "blue",
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 text-${color}-600`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </CardContent>
  </Card>
);

const RecentItem = ({ item, type, onSelect }) => {
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) return "오늘";
    if (isYesterday(date)) return "어제";
    return format(date, "M월 d일");
  };

  const Icon = type === "note" ? FileText : BookOpen;

  return (
    <div
      onClick={() => onSelect(item, type)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
    >
      <Icon className="h-5 w-5 text-slate-500" />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{item.title}</h4>
        <p className="text-xs text-slate-500">
          {getRelativeTime(item.updated_date)}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </div>
  );
};

const ProjectCard = ({ project, stats, onSelect }) => {
  const projectColors = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    red: "bg-red-100 text-red-800 border-red-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    pink: "bg-pink-100 text-pink-800 border-pink-200",
  };

  const colorClass = projectColors[project.color] || projectColors.blue;
  const progress =
    stats.targetChars > 0
      ? Math.min((stats.currentChars / stats.targetChars) * 100, 100)
      : 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-slate-300"
      onClick={() => onSelect(project)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            {project.title}
          </CardTitle>
          <Badge className={`text-xs ${colorClass}`}>
            {stats.noteCount}개 문서
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.targetChars > 0 ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">진행률</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{stats.currentChars.toLocaleString()} 글자</span>
              <span>목표: {stats.targetChars.toLocaleString()} 글자</span>
            </div>
          </>
        ) : (
          <div className="py-2">
            <div className="text-sm text-slate-600 mb-1">작성된 글자 수</div>
            <div className="text-lg font-semibold">
              {stats.currentChars.toLocaleString()} 글자
            </div>
            <div className="text-xs text-slate-500 mt-1">
              문서에 목표 글자수를 설정하면 진행률이 표시됩니다
            </div>
          </div>
        )}
        {stats.lastActivity && (
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            마지막 수정: {format(new Date(stats.lastActivity), "M월 d일")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const { notes, references, projects, setCurrentProject, isLoading } =
    useData();
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    const allItems = [
      ...notes.map((note) => ({ ...note, type: "note" })),
      ...references.map((ref) => ({ ...ref, type: "reference" })),
    ];

    const sorted = allItems
      .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
      .slice(0, 5);

    setRecentItems(sorted);
  }, [notes, references]);

  const handleSelectProject = (project) => {
    setCurrentProject(project);
    window.location.href = createPageUrl("Workspace");
  };

  const handleSelectRecentItem = (item, type) => {
    if (type === "note") {
      if (item.project_id) {
        const project = projects.find((p) => p.id === item.project_id);
        if (project) setCurrentProject(project);
      } else {
        setCurrentProject(null);
      }
      window.location.href = createPageUrl("Workspace") + `?noteId=${item.id}`;
    } else if (type === "reference") {
      window.location.href =
        createPageUrl("Workspace") + `?referenceId=${item.id}`;
    }
  };

  const handleGoToWorkspace = () => {
    window.location.href = createPageUrl("Workspace");
  };

  const getProjectStats = (projectId) => {
    const projectNotes = notes.filter((note) => note.project_id === projectId);
    const currentChars = projectNotes.reduce((sum, note) => {
      if (!note.content) return sum;
      return sum + note.content.replace(/<[^>]*>/g, "").length;
    }, 0);

    const targetChars = projectNotes.reduce((sum, note) => {
      return sum + (note.target_words || 0);
    }, 0);

    const lastActivity =
      projectNotes.length > 0
        ? Math.max(
            ...projectNotes.map((note) => new Date(note.updated_date).getTime())
          )
        : null;

    return {
      noteCount: projectNotes.length,
      currentChars,
      targetChars,
      lastActivity: lastActivity ? new Date(lastActivity) : null,
    };
  };

  const totalNotes = notes.length;
  const totalReferences = references.length;
  const totalProjects = projects.length;
  const totalChars = notes.reduce((sum, note) => {
    if (!note.content) return sum;
    return sum + note.content.replace(/<[^>]*>/g, "").length;
  }, 0);

  const todayNotes = notes.filter((note) =>
    isToday(new Date(note.updated_date))
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                스크립트 스튜디오
              </h1>
              <p className="text-slate-600 mt-1">
                창작 프로젝트를 체계적으로 관리하세요
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleGoToWorkspace}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                워크스페이스로 이동
              </Button>
              <Button onClick={handleGoToWorkspace}>
                <Plus className="h-4 w-4 mr-2" />새 문서 작성
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="전체 문서"
            value={totalNotes}
            icon={FileText}
            description={`오늘 수정: ${todayNotes}개`}
            color="blue"
          />
          <StatCard
            title="프로젝트"
            value={totalProjects}
            icon={FolderOpen}
            description="활성 프로젝트 수"
            color="green"
          />
          <StatCard
            title="참고문헌"
            value={totalReferences}
            icon={BookOpen}
            description="수집된 자료"
            color="purple"
          />
          <StatCard
            title="총 글자 수"
            value={totalChars.toLocaleString()}
            icon={BarChart3}
            description="작성된 글자"
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PomoFlowStats />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">
                  내 프로젝트
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToWorkspace}
                >
                  <Plus className="h-4 w-4 mr-2" />새 프로젝트
                </Button>
              </div>

              {projects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">
                      프로젝트를 시작해보세요
                    </h3>
                    <p className="text-slate-500 mb-6">
                      첫 번째 창작 프로젝트를 만들어 체계적으로 관리해보세요.
                    </p>
                    <Button onClick={handleGoToWorkspace}>
                      <Plus className="h-4 w-4 mr-2" />새 프로젝트 만들기
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      stats={getProjectStats(project.id)}
                      onSelect={handleSelectProject}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                최근 활동
              </h2>
              <Card>
                <CardContent className="p-0">
                  {recentItems.length === 0 ? (
                    <div className="p-6 text-center">
                      <Clock className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-slate-500">최근 활동이 없습니다</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentItems.map((item) => (
                        <RecentItem
                          key={`${item.type}-${item.id}`}
                          item={item}
                          type={item.type}
                          onSelect={handleSelectRecentItem}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                빠른 액션
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10"
                      onClick={handleGoToWorkspace}
                    >
                      <FileText className="h-4 w-4 mr-3" />새 문서 작성
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10"
                      onClick={() =>
                        (window.location.href =
                          createPageUrl("Workspace") + "?view=daily")
                      }
                    >
                      <Calendar className="h-4 w-4 mr-3" />
                      오늘 일기 쓰기
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10"
                      asChild
                    >
                      <Link to={createPageUrl("Templates")}>
                        <FileSignature className="h-4 w-4 mr-3" />
                        템플릿 관리
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10"
                      onClick={handleGoToWorkspace}
                    >
                      <BookOpen className="h-4 w-4 mr-3" />
                      참고문헌 추가
                    </Button>
                    <ImportBackupButton
                      variant="ghost"
                      className="w-full justify-start h-10"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
