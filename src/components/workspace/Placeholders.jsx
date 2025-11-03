import React from 'react';
import { PenSquare, Loader2 } from 'lucide-react';

export const WelcomeScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-100/50 text-center p-8">
      <PenSquare className="h-16 w-16 text-slate-300 mb-6" />
      <h2 className="text-2xl font-semibold text-slate-700 mb-2">
        스크립트 스튜디오
      </h2>
      <p className="text-slate-500 max-w-sm">
        좌측 바인더에서 문서를 선택하여 집필을 시작하거나, 새 문서 또는 폴더를 만들어 당신의 프로젝트를 구성하세요.
      </p>
    </div>
  );
};

export const LoadingScreen = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-white">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-slate-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">프로젝트를 불러오는 중...</p>
      </div>
    </div>
  );
};