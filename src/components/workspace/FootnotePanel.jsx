import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function FootnotePanel({ footnotes, onUpdate, onDelete }) {
  const handleContentChange = (id, newContent) => {
    const updatedFootnotes = footnotes.map((fn) =>
      fn.id === id ? { ...fn, content: newContent } : fn
    );
    onUpdate(updatedFootnotes);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 border-l border-slate-200">
      <div className="h-12 px-4 py-3 border-b border-slate-200 bg-white flex items-center">
        <h3 className="text-sm font-semibold text-slate-800">각주</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {footnotes.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p className="text-sm">각주가 없습니다.</p>
            <p className="text-xs mt-2 text-slate-400">
              에디터 상단의 각주 추가 버튼으로 새 각주를 만드세요.
            </p>
          </div>
        ) : (
          footnotes.map((footnote) => (
            <div
              key={footnote.id}
              className="flex gap-3 p-3 bg-white rounded-lg border border-slate-200/60"
            >
              <div className="font-semibold text-slate-600 text-sm flex-shrink-0 w-8 pt-2">
                [{footnote.id}]
              </div>
              <div className="flex-1">
                <Textarea
                  value={footnote.content}
                  onChange={(e) =>
                    handleContentChange(footnote.id, e.target.value)
                  }
                  placeholder="각주 내용을 입력하세요..."
                  className="text-sm min-h-[80px] resize-none border-slate-200 focus:border-primary/50"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(footnote.id)}
                className="self-start mt-1 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
