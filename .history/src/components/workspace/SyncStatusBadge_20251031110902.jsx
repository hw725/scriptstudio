import { useEffect, useState } from 'react';
import { useData } from '@/components/providers/DataProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database,
  Clock,
  AlertCircle 
} from 'lucide-react';

/**
 * 동기화 상태 표시 컴포넌트
 * 오프라인 모드 작동 여부를 확인할 수 있습니다
 */
export function SyncStatusBadge() {
  const { isOnline, syncStatus, syncManager } = useData();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const updateStatus = async () => {
      if (syncManager) {
        const currentStatus = await syncManager.getSyncStatus();
        setStatus(currentStatus);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, [syncManager]);

  const handleManualSync = async () => {
    if (syncManager && isOnline) {
      await syncManager.sync();
      const newStatus = await syncManager.getSyncStatus();
      setStatus(newStatus);
    }
  };

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-background border rounded-lg">
      {/* 온라인/오프라인 상태 */}
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <>
            <Wifi className="w-3 h-3" />
            온라인
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            오프라인
          </>
        )}
      </Badge>

      {/* 동기화 중 상태 */}
      {status.isSyncing && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          동기화 중...
        </Badge>
      )}

      {/* 대기 중인 변경사항 */}
      {status.pendingChanges > 0 && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          {status.pendingChanges}개 대기
        </Badge>
      )}

      {/* 마지막 동기화 시간 */}
      {status.lastSync && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Clock className="w-3 h-3" />
          {formatLastSync(status.lastSync)}
        </Badge>
      )}

      {/* 수동 동기화 버튼 */}
      {isOnline && !status.isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          className="h-6 px-2"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      )}

      {/* 오프라인 경고 */}
      {!isOnline && status.pendingChanges > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          온라인 시 자동 동기화
        </Badge>
      )}
    </div>
  );
}

/**
 * 마지막 동기화 시간을 사람이 읽기 쉬운 형태로 포맷
 */
function formatLastSync(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
}

export default SyncStatusBadge;
