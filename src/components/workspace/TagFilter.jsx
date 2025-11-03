import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hash, X } from 'lucide-react';

const TagFilter = ({ allTags, selectedTags, onTagSelect, onTagDeselect, onClearAll }) => {
  if (allTags.length === 0) return null;

  return (
    <div className="p-4 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Hash className="h-4 w-4" />
          태그 필터
        </h4>
        {selectedTags.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearAll}
            className="text-xs h-6 px-2"
          >
            모두 해제
          </Button>
        )}
      </div>
      
      {selectedTags.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-2">선택된 태그:</p>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map(tag => (
              <Badge 
                key={tag} 
                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                onClick={() => onTagDeselect(tag)}
              >
                <Hash className="h-3 w-3" />
                {tag}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <div>
        <p className="text-xs text-slate-500 mb-2">사용 가능한 태그:</p>
        <div className="flex flex-wrap gap-1">
          {allTags
            .filter(tag => !selectedTags.includes(tag))
            .map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-slate-100 text-slate-600"
                onClick={() => onTagSelect(tag)}
              >
                <Hash className="h-3 w-3" />
                {tag}
              </Badge>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default TagFilter;