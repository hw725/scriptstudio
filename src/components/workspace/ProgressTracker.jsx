import React, { useState, useEffect, useCallback } from "react";
import { ProjectSettings } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Calendar, Settings } from "lucide-react";
import { useData } from "@/components/providers/DataProvider"; // useData 훅 임포트

const getCharCount = (text) => {
  if (!text) return 0;
  // HTML 태그를 제거하고 실제 텍스트 길이만 계산
  const plainText = text.replace(/<[^>]*>/g, "");
  return plainText.trim().length;
};

export default function ProgressTracker({
  notes: _notes,
  isVisible,
  onToggle,
  currentProject,
}) {
  const { allNotes } = useData(); // 전체 노트 데이터 가져오기
  const [settings, setSettings] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempSettings, setTempSettings] = useState({});
  const [todayWrittenChars, setTodayWrittenChars] = useState(0);

  // 현재 프로젝트에 해당하는 노트만 필터링
  // The 'notes' prop is no longer directly used for progress calculations; 'allNotes' from DataProvider is used instead.
  const projectNotes = currentProject
    ? allNotes.filter((note) => note.project_id === currentProject.id)
    : allNotes;

  const loadSettings = useCallback(async () => {
    try {
      // currentProject가 없으면 설정을 로드하지 않음
      if (!currentProject) {
        return;
      }

      // 프로젝트별 설정을 찾아 로드합니다.
      const settingsList = await ProjectSettings.list();
      const filtered = settingsList.filter(
        (s) => s.project_id === currentProject.id
      );

      if (filtered.length > 0) {
        setSettings(filtered[0]);
        setTempSettings(filtered[0]);
      } else {
        // 설정이 없으면 새로 생성
        const newSettings = await ProjectSettings.create({
          project_id: currentProject.id,
          project_title: currentProject.title || "프로젝트",
          daily_word_target: 500, // 글자 수로 변경 (한국어 기준)
          project_word_target: 50000, // 이 값은 편집 UI에서 제거되고, 실제로는 각 노트의 target_words 합계로 사용됨. 초기값으로만 존재.
          current_session_words: 0, // 이 값은 오늘 쓴 글자 수로 대체될 예정이므로, 현재는 사용되지 않음
        });
        setSettings(newSettings);
        setTempSettings(newSettings);
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
    }
  }, [currentProject]);

  useEffect(() => {
    // 설정을 불러오는 로직
    loadSettings();
  }, [loadSettings]); // loadSettings 함수가 변경될 때마다 설정을 다시 로드

  useEffect(() => {
    // 오늘 작성한 글자 수 계산
    const calculateTodayChars = () => {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      let count = 0;
      projectNotes.forEach((note) => {
        const updatedDate = new Date(note.updated_date);
        // Check if updatedDate is a valid date and falls on today
        if (!isNaN(updatedDate.getTime()) && updatedDate >= todayStart) {
          // 이 부분은 개선이 필요할 수 있습니다.
          // 정확한 "오늘 쓴 양"을 계산하려면 버전 관리나 별도 로그가 필요합니다.
          // 여기서는 오늘 수정된 문서의 전체 글자 수를 더하는 방식으로 근사치를 계산합니다.
          count += getCharCount(note.content);
        }
      });
      setTodayWrittenChars(count);
    };

    calculateTodayChars();
  }, [projectNotes]); // projectNotes가 변경될 때마다 다시 계산

  const saveSettings = async () => {
    try {
      await ProjectSettings.update(settings.id, tempSettings);
      setSettings({ ...tempSettings });
      setIsEditing(false);
    } catch (error) {
      console.error("설정 저장 실패:", error);
    }
  };

  if (!settings) return null;

  // 전체 글자수와 목표 글자수를 현재 프로젝트 기준으로 다시 계산합니다.
  const totalChars = projectNotes.reduce(
    (sum, note) => sum + getCharCount(note.content),
    0
  );
  // 프로젝트 전체 목표는 각 노트의 target_words를 합산하여 계산
  const projectWordTarget = projectNotes.reduce(
    (sum, note) => sum + (note.target_words || 0),
    0
  );

  const dailyProgress = Math.min(
    (todayWrittenChars / settings.daily_word_target) * 100,
    100
  );
  // 프로젝트 진행률은 totalChars를 projectWordTarget으로 나눕니다. 0으로 나누는 경우를 방지합니다.
  const projectProgress =
    projectWordTarget > 0
      ? Math.min((totalChars / projectWordTarget) * 100, 100)
      : 0;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
        >
          <Target className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              {currentProject
                ? `${currentProject.title} 진행 상황`
                : "전체 진행 상황"}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
                className="h-6 w-6"
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                onClick={onToggle}
                variant="ghost"
                size="sm"
                className="h-6 px-2"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <div className="space-y-3">
              {/* 프로젝트 제목 입력 필드는 이제 currentProject의 title을 따르므로 제거 */}
              <div className="grid grid-cols-1 gap-2">
                {" "}
                {/* 그리드 컬럼을 1개로 변경 */}
                <Input
                  type="number"
                  placeholder="일일 목표 (글자)"
                  value={tempSettings.daily_word_target || ""}
                  onChange={(e) =>
                    setTempSettings((prev) => ({
                      ...prev,
                      daily_word_target: Number(e.target.value),
                    }))
                  }
                />
                {/* 프로젝트 목표 글자수 입력 필드는 각 문서의 목표 글자수 합계로 자동 계산되므로 제거 */}
              </div>
              <p className="text-xs text-slate-500">
                프로젝트 전체 목표는 각 문서의 목표 글자수 합계로 자동
                계산됩니다.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={saveSettings}
                  size="sm"
                  className="flex-1"
                >
                  저장
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setTempSettings(settings);
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    오늘 목표
                  </span>
                  <span className="font-mono">
                    {todayWrittenChars.toLocaleString()} /{" "}
                    {settings.daily_word_target.toLocaleString()} 글자
                  </span>
                </div>
                <Progress
                  value={dailyProgress}
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    프로젝트 진행
                  </span>
                  <span className="font-mono">
                    {totalChars.toLocaleString()} /{" "}
                    {projectWordTarget.toLocaleString()} 글자
                  </span>
                </div>
                <Progress
                  value={projectProgress}
                  className="mt-1"
                />
              </div>

              <div className="text-xs text-slate-500 pt-2 border-t">
                <div>전체 문서: {projectNotes.length}개</div>
                <div>완료율: {projectProgress.toFixed(1)}%</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
