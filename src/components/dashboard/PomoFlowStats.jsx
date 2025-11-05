import React, { useState, useEffect } from "react";
import { syncPomoFlow } from "@/api/functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BrainCircuit,
  Coffee,
  PlayCircle,
  PauseCircle,
  Loader2,
} from "lucide-react";
import { useData } from "@/components/providers/DataProvider";

const TimerDisplay = ({ state, linkedNote }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (
        !state ||
        state.status !== "running" ||
        !state.start_time ||
        !state.duration_minutes
      ) {
        setTimeLeft("");
        return;
      }
      const startTime = new Date(state.start_time);
      const endTime = new Date(
        startTime.getTime() + state.duration_minutes * 60000
      );
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("00:00");
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000); // Fixed: Changed calculateTime to calculateTimeLeft
    return () => clearInterval(interval);
  }, [state]);

  if (!state || state.status !== "running" || !linkedNote) {
    return (
      <div className="flex items-center gap-3 text-slate-500">
        <PauseCircle className="h-5 w-5" />
        <span>현재 진행 중인 세션이 없습니다.</span>
      </div>
    );
  }

  const sessionIcons = {
    pomodoro: <BrainCircuit className="h-5 w-5 text-red-500" />,
    short_break: <Coffee className="h-5 w-5 text-green-500" />,
    long_break: <Coffee className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {sessionIcons[state.session_type] || <PlayCircle className="h-5 w-5" />}
        <div>
          <p className="font-semibold">{linkedNote.title}</p>
          <p className="text-sm text-slate-500 capitalize">
            {state.session_type.replace("_", " ")}
          </p>
        </div>
      </div>
      <div className="text-2xl font-mono font-bold tracking-tighter">
        {timeLeft}
      </div>
    </div>
  );
};

export default function PomoFlowStats() {
  const { allNotes } = useData();
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const { data } = await syncPomoFlow({ action: "getPomoFlowOverview" });
        if (data.success) {
          setOverview(data);
        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const linkedNote = overview?.timerState?.task?.id
    ? allNotes.find(
        (note) => note.pomoflow_task_id === overview.timerState.task.id
      )
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PomoFlow 생산성 현황</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="ml-4 text-slate-600">
            PomoFlow 데이터를 불러오는 중...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PomoFlow 생산성 현황</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-red-600">데이터를 불러오는 데 실패했습니다.</p>
          <p className="text-xs text-slate-500 mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!overview || !overview.timerState) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>PomoFlow 생산성 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <TimerDisplay
          state={overview.timerState}
          linkedNote={linkedNote}
        />
      </CardContent>
    </Card>
  );
}
