import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function NoteSuggestionPopover({ isOpen, targetRect, suggestions, onSelect, onClose, selectedIndex }) {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !targetRect) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50"
      style={{
        top: `${targetRect.bottom + 5}px`,
        left: `${targetRect.left}px`,
      }}
    >
      <Card className="w-80 shadow-lg border">
        <CardContent className="p-2 max-h-80 overflow-y-auto">
          {suggestions.length > 0 ? (
            suggestions.map((note, index) => (
              <div
                key={note.id}
                onClick={() => onSelect(note.title)}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm ${
                  index === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
              >
                <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <span className="truncate">{note.title}</span>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-center text-slate-500">
              일치하는 노트 없음
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}