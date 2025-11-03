import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, X } from 'lucide-react';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';

const VersionItem = ({ version, onRestore, onPreview, isPreviewing }) => {
  return (
    <Card className={`mb-3 ${isPreviewing ? 'border-primary' : ''}`}>
      <CardContent className="p-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">{version.title}</p>
            <p className="text-xs text-slate-500">
              {format(new Date(version.created_date), 'yyyy년 M월 d일 HH:mm:ss')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onPreview(version)}>
              {isPreviewing ? '미리보기 닫기' : '미리보기'}
            </Button>
            <Button size="sm" onClick={() => onRestore(version)}>복원</Button>
          </div>
        </div>
        {isPreviewing && (
          <div className="mt-4 p-2 border-t">
              <ReactQuill
                value={version.content}
                readOnly={true}
                theme="bubble"
              />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function VersionHistoryPanel({ versions, onRestore, onClose }) {
  const [previewVersionId, setPreviewVersionId] = React.useState(null);

  const handlePreview = (version) => {
    setPreviewVersionId(currentId => currentId === version.id ? null : version.id);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 border-l border-slate-200">
      <div className="h-12 px-4 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <History className="h-4 w-4" />
          버전 기록
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {versions.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p className="text-sm">저장된 버전이 없습니다.</p>
            <p className="text-xs mt-2 text-slate-400">내용이 변경되면 자동으로 버전이 저장됩니다.</p>
          </div>
        ) : (
          versions.map(version => (
            <VersionItem 
              key={version.id} 
              version={version}
              onRestore={onRestore}
              onPreview={handlePreview}
              isPreviewing={previewVersionId === version.id}
            />
          ))
        )}
      </div>
    </div>
  );
}