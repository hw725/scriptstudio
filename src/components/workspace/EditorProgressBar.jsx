import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

export default function EditorProgressBar({ 
  currentChars, 
  targetChars, 
  onTargetChange, 
  projectChars, 
  projectTarget, 
  isInProject,
  disabled = false 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState('');

  const progress = targetChars > 0 ? Math.min((currentChars / targetChars) * 100, 100) : 0;
  const projectProgress = projectTarget > 0 ? Math.min((projectChars / projectTarget) * 100, 100) : 0;

  const handleEditTarget = () => {
    if (disabled) return;
    setTempTarget(targetChars ? String(targetChars) : '');
    setIsEditing(true);
  };

  const handleSaveTarget = () => {
    const numericTarget = tempTarget ? parseInt(tempTarget, 10) : null;
    onTargetChange(numericTarget);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTarget();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 space-y-3">
      <div className="flex items-center gap-x-4 gap-y-2 flex-wrap flex-1 min-w-0">
        {/* 문서 진행 상황 */}
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-slate-700 whitespace-nowrap">
            <span className="font-semibold">문서:</span>
            <span className="font-mono ml-1">{currentChars.toLocaleString()}</span>
            {targetChars > 0 && (
              <span className="text-slate-500"> / {Number(targetChars).toLocaleString()}</span>
            )}
          </div>
          {targetChars > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={progress} className="w-20 h-2" />
              <span className="text-xs text-slate-500 font-mono">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
        
        {/* 프로젝트 진행 상황 */}
        {isInProject && projectTarget > 0 && (
          <>
            <div className="h-6 border-l border-slate-300 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-slate-500 whitespace-nowrap">
                <span className="font-semibold">프로젝트:</span>
                <span className="font-mono ml-1">{projectChars.toLocaleString()}</span>
                <span className="text-slate-500"> / {projectTarget.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={projectProgress} className="w-20 h-2" />
                <span className="text-xs text-slate-500 font-mono">{Math.round(projectProgress)}%</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={tempTarget}
              onChange={(e) => setTempTarget(e.target.value)}
              placeholder="목표 글자 수"
              className="w-32 h-8 text-sm"
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSaveTarget} size="sm" className="h-8">저장</Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="h-8">취소</Button>
          </div>
        ) : (
          <Button 
            onClick={handleEditTarget}
            variant="outline" 
            size="sm" 
            className="h-8 gap-2"
            disabled={disabled}
          >
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{targetChars ? '문서 목표 수정' : '문서 목표 설정'}</span>
            <span className="sm:hidden">목표</span>
          </Button>
        )}
      </div>
    </div>
  );
}