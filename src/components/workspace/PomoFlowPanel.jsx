import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Timer,
  Play,
  Square,
  Coffee,
  BrainCircuit,
  X,
  Link,
  Loader2,
  Pause,
} from "lucide-react";
import { syncPomoFlow } from "@/api/functions";

export default function PomoFlowPanel({ note, isVisible, onToggle }) {
  const [status, setStatus] = useState("idle"); // 'idle', 'running', 'paused'
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Time in seconds, initial 25 minutes
  const [totalDuration, setTotalDuration] = useState(25 * 60); // Total duration in seconds, initial 25 minutes
  const [sessionType, setSessionType] = useState("pomodoro"); // 'pomodoro', 'short_break', 'long_break'
  const [task, setTask] = useState(null); // Linked task information
  const [timerState, setTimerState] = useState(null); // Raw timer state from backend
  const [isLoading, setIsLoading] = useState(false);
  const [isControlling, setIsControlling] = useState(false);
  const [error, setError] = useState(null);

  // Derive if the current note is linked to a task
  const isLinked = !!task?.id;

  // Determine if the timer displayed is for the current task and is active
  const isCurrentTaskActive =
    timerState &&
    timerState.status !== "idle" &&
    timerState.selected_task_id === task?.id;

  // Session icons and colors for timer display, moved from TimerDisplay component
  const sessionIcons = {
    pomodoro: <BrainCircuit className="h-4 w-4 text-red-500" />,
    short_break: <Coffee className="h-4 w-4 text-green-500" />,
    long_break: <Coffee className="h-4 w-4 text-blue-500" />,
  };

  const sessionColors = {
    pomodoro: "#EF4444", // red-500
    short_break: "#10B981", // green-500
    long_break: "#10B981", // green-500
  };

  const getStatusText = useCallback(() => {
    if (status === "paused") return "일시정지";
    if (status === "running") return sessionType?.replace("_", " ");
    return "대기 중";
  }, [status, sessionType]);

  const fetchLinkStatus = useCallback(async () => {
    if (!note?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await syncPomoFlow({
        action: "getLinkStatus",
        data: { noteId: note.id },
      });

      if (data.success) {
        setTask(data.task);
        setTimerState(data.timerState);
      } else {
        // If not linked or no timer, reset states
        setTask(null);
        setTimerState(null);
        setStatus("idle");
        setTimeLeft(25 * 60);
        setTotalDuration(25 * 60);
        setSessionType("pomodoro");
      }
    } catch (err) {
      console.error("링크 상태 확인 실패:", err);
      setError("연결 상태를 확인할 수 없습니다");
      // Reset states on error
      setTask(null);
      setTimerState(null);
      setStatus("idle");
      setTimeLeft(25 * 60);
      setTotalDuration(25 * 60);
      setSessionType("pomodoro");
    } finally {
      setIsLoading(false);
    }
  }, [note?.id]);

  const handleControl = useCallback(
    async (command, _force = false) => {
      if (isControlling) return;

      // Pause, resume, stop require an existing timerState to act upon which is linked to current task
      if (
        (command === "pause" || command === "resume" || command === "stop") &&
        (!timerState || !isCurrentTaskActive)
      ) {
        console.warn(
          `Cannot execute command '${command}': No active timer state or not for current task.`
        );
        setError(
          "현재 활성화된 타이머가 없거나 이 작업에 연결된 타이머가 아닙니다."
        );
        return;
      }
      // Start commands require a linked task
      if (
        (command === "start_pomodoro" ||
          command === "start_short_break" ||
          command === "start_long_break") &&
        !task?.id
      ) {
        console.warn(`Cannot execute command '${command}': No task linked.`);
        setError("타이머를 시작하려면 먼저 작업을 연결해야 합니다.");
        return;
      }

      setIsControlling(true);
      setError(null);

      try {
        const { data, status: responseStatus } = await syncPomoFlow({
          action: "controlTimer",
          data: { command, taskId: task?.id },
        });

        if (data.success) {
          setTimerState(data.timerState);
        } else if (responseStatus === 409 && data.error === "conflict") {
          // 다른 작업이 실행 중일 때의 처리
          if (window.confirm(data.message)) {
            // 먼저 기존 작업을 중지하고, 그 다음에 새 작업을 시작해야 합니다.
            // 1. 기존 작업 정지
            const { data: stopData } = await syncPomoFlow({
              action: "controlTimer",
              data: { command: "stop" },
            });

            if (stopData.success) {
              // 2. 새 작업 시작 (재귀 호출 대신 직접 호출)
              const { data: newData } = await syncPomoFlow({
                action: "controlTimer",
                data: { command, taskId: task?.id },
              });
              if (newData.success) {
                setTimerState(newData.timerState);
              } else {
                setError(newData.message || "작업을 전환하는 데 실패했습니다.");
              }
            } else {
              setError(
                stopData.message || "기존 타이머를 중지하는 데 실패했습니다."
              );
            }
          }
        } else if (data.message) {
          setError(data.message);
        }
      } catch (err) {
        console.error("타이머 제어 실패:", err);
        setError("타이머 제어에 실패했습니다");
      } finally {
        setIsControlling(false);
      }
    },
    [
      isControlling,
      timerState,
      isCurrentTaskActive,
      task,
      setError,
      setTimerState,
    ]
  );

  // 타이머 완료 처리 함수
  const handleTimerComplete = useCallback(async () => {
    if (!timerState || !task) {
      console.warn(
        "handleTimerComplete called without active timerState or task."
      );
      return;
    }

    // Capture current session type as it might change during async operations
    const currentSessionType = timerState.session_type;

    try {
      if (currentSessionType === "pomodoro") {
        if (
          window.confirm(
            "뽀모도로 세션이 완료되었습니다! 5분 휴식을 시작하시겠습니까?"
          )
        ) {
          await handleControl("start_short_break");
        } else {
          // 휴식하지 않으면 타이머 정지
          await handleControl("stop");
        }
      } else {
        // 휴식 완료 -> 새 뽀모도로 제안 또는 정지
        if (
          window.confirm(
            "휴식이 끝났습니다! 새로운 뽀모도로 세션을 시작하시겠습니까?"
          )
        ) {
          await handleControl("start_pomodoro");
        } else {
          await handleControl("stop");
        }
      }
    } catch (error) {
      console.error("타이머 완료 처리 실패:", error);
      setError("타이머 완료 처리 중 오류가 발생했습니다: " + error.message);
    }
  }, [timerState, task, handleControl, setError]);

  // Initial fetch of link status when note changes
  useEffect(() => {
    if (note) {
      fetchLinkStatus();
    }
  }, [note, fetchLinkStatus]);

  // Effect for client-side timer countdown and state synchronization
  useEffect(() => {
    let interval;

    const updateTimerDisplay = () => {
      if (isCurrentTaskActive && timerState.status === "running") {
        const startTime = new Date(timerState.start_time).getTime();
        const totalDurationSeconds = timerState.duration_minutes * 60;
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, totalDurationSeconds - elapsed);

        setTimeLeft(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          handleTimerComplete(); // 타이머 완료 처리
        }
      }
    };

    if (isCurrentTaskActive && timerState.status === "running") {
      updateTimerDisplay(); // Run once immediately
      interval = setInterval(updateTimerDisplay, 1000);
    } else if (
      isCurrentTaskActive &&
      timerState.status === "paused" &&
      typeof timerState.time_left_on_pause === "number"
    ) {
      setTimeLeft(timerState.time_left_on_pause);
    } else {
      // If not active, or idle/completed, set to default or timerState's duration
      setTimeLeft(timerState ? timerState.duration_minutes * 60 : 25 * 60);
    }

    if (timerState) {
      setStatus(timerState.status);
      setSessionType(timerState.session_type);
      setTotalDuration(timerState.duration_minutes * 60);
    } else {
      // If no timerState (e.g., unlinked or initial load)
      setStatus("idle");
      setSessionType("pomodoro");
      setTotalDuration(25 * 60);
      // timeLeft is already set by the else block above
    }

    return () => clearInterval(interval);
  }, [timerState, isCurrentTaskActive, handleTimerComplete]);

  const handleLink = async () => {
    if (!note?.id || !note?.title) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await syncPomoFlow({
        action: "linkToTask",
        data: { noteId: note.id, noteTitle: note.title },
      });

      if (data.success) {
        await fetchLinkStatus(); // Refresh status after linking
      }
    } catch (err) {
      console.error("작업 연결 실패:", err);
      setError("작업 연결에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations for display
  const percentage = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Timer className="h-4 w-4" />
          <span className="hidden sm:inline">뽀모도로</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-72 max-w-[calc(100vw-2rem)]">
      <Card className="border shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 min-w-0">
              <Timer className="h-4 w-4 flex-shrink-0" />
              {isLinked && task ? (
                <span className="truncate">{task.title}</span>
              ) : (
                "PomoFlow"
              )}
            </CardTitle>
            <Button
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="h-6 px-2 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          {error && (
            <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
              {error}
            </div>
          )}

          {!isLinked ? (
            <div className="text-center py-2">
              <p className="text-sm text-slate-600 mb-3">
                집중 시간을 측정하려면 이 문서를 PomoFlow 작업에 연결하세요.
              </p>
              <Button
                onClick={handleLink}
                disabled={isLoading}
                className="gap-2 w-full h-9"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
                <span className="hidden xs:inline">작업 연결</span>
                <span className="xs:hidden">연결</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Timer Display Logic (previously in TimerDisplay component) */}
              <div className="relative w-40 h-40 mx-auto flex flex-col items-center justify-center">
                <svg
                  className="w-full h-full absolute"
                  viewBox="0 0 100 100"
                >
                  <circle
                    className="text-slate-200"
                    stroke="currentColor"
                    strokeWidth="8"
                    cx="50"
                    cy="50"
                    r="42"
                    fill="transparent"
                  />
                  {/* Only show progress circle if timer is active or paused for the current task */}
                  {(isCurrentTaskActive || status === "paused") && (
                    <circle
                      className="transform -rotate-90 origin-center"
                      stroke={
                        status === "paused"
                          ? "#F59E0B"
                          : sessionColors[sessionType] || "hsl(var(--primary))"
                      }
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={
                        2 * Math.PI * 42 * (1 - percentage / 100)
                      }
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      style={{ transition: "stroke-dashoffset 1s linear" }}
                    />
                  )}
                </svg>
                <div className="flex items-center justify-center gap-1">
                  {status === "paused" ? (
                    <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-sm"></div>
                    </div>
                  ) : (
                    sessionIcons[sessionType] || <Timer className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium capitalize">
                    {getStatusText()}
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold text-slate-800 mt-1">
                  {`${String(minutes).padStart(2, "0")}:${String(
                    seconds
                  ).padStart(2, "0")}`}
                </div>
              </div>

              {/* Control Buttons from outline */}
              <div className="flex flex-col gap-2">
                {isCurrentTaskActive && status === "running" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleControl("pause")}
                      disabled={isControlling}
                      variant="outline"
                      className="gap-1 h-9 text-xs"
                    >
                      {isControlling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Pause className="h-3 w-3" />
                      )}
                      <span className="hidden xs:inline">일시정지</span>
                      <span className="xs:hidden">정지</span>
                    </Button>
                    <Button
                      onClick={() => handleControl("stop")}
                      disabled={isControlling}
                      variant="destructive"
                      className="gap-1 h-9 text-xs"
                    >
                      {isControlling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Square className="h-3 w-3" />
                      )}
                      <span className="hidden xs:inline">중지</span>
                      <span className="xs:hidden">끝</span>
                    </Button>
                  </div>
                ) : isCurrentTaskActive && status === "paused" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleControl("resume")}
                      disabled={isControlling}
                      className="gap-1 bg-green-600 hover:bg-green-700 text-white h-9 text-xs"
                    >
                      {isControlling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      <span className="hidden xs:inline">재시작</span>
                      <span className="xs:hidden">재시작</span>
                    </Button>
                    <Button
                      onClick={() => handleControl("stop")}
                      disabled={isControlling}
                      variant="destructive"
                      className="gap-1 h-9 text-xs"
                    >
                      {isControlling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Square className="h-3 w-3" />
                      )}
                      <span className="hidden xs:inline">중지</span>
                      <span className="xs:hidden">끝</span>
                    </Button>
                  </div>
                ) : (
                  // Default state or timer not for current task (idle)
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleControl("start_pomodoro")}
                      disabled={isControlling}
                      className="gap-1 bg-red-600 hover:bg-red-700 text-white h-9 text-xs"
                    >
                      {isControlling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      <span className="hidden xs:inline">뽀모도로</span>
                      <span className="xs:hidden">25분</span>
                    </Button>
                    <Button
                      onClick={() => handleControl("start_short_break")}
                      disabled={isControlling}
                      variant="outline"
                      className="gap-1 h-9 text-xs"
                    >
                      {isControlling ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Coffee className="h-3 w-3" />
                      )}
                      <span className="hidden xs:inline">휴식</span>
                      <span className="xs:hidden">5분</span>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
