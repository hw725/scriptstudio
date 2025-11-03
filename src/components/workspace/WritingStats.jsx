import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, X } from 'lucide-react';

const getCharCount = (text) => {
  if (!text) return 0;
  return text.replace(/<[^>]*>/g, '').length;
};

const getSentenceCount = (text) => {
  if (!text) return 0;
  const plainText = text.replace(/<[^>]*>/g, '');
  return plainText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
};

const getParagraphCount = (text) => {
  if (!text) return 0;
  const paragraphs = text.split(/<\/p>|<br\s*\/?>/i).filter(p => p.replace(/<[^>]*>/g, '').trim().length > 0);
  return paragraphs.length;
};

const getReadingTime = (charCount) => {
  // 한국어 기준: 평균 분당 400-500 글자 읽기 속도
  const charsPerMinute = 450;
  return Math.ceil(charCount / charsPerMinute);
};

export default function WritingStats({ content, isVisible, onToggle }) {
  const stats = useMemo(() => {
    const chars = getCharCount(content);
    const sentences = getSentenceCount(content);
    const paragraphs = getParagraphCount(content);
    const readingTime = getReadingTime(chars);
    
    return {
      chars,
      sentences,
      paragraphs,
      readingTime,
      avgCharsPerSentence: sentences > 0 ? Math.round(chars / sentences) : 0,
      avgSentencesPerParagraph: paragraphs > 0 ? Math.round(sentences / paragraphs) : 0
    };
  }, [content]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4">
        <Button onClick={onToggle} variant="outline" size="sm">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-72">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              작성 통계
            </CardTitle>
            <Button onClick={onToggle} variant="ghost" size="sm" className="h-6 px-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-slate-500">글자 수</div>
              <div className="font-mono font-semibold">{stats.chars.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500">문장 수</div>
              <div className="font-mono font-semibold">{stats.sentences.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500">문단 수</div>
              <div className="font-mono font-semibold">{stats.paragraphs.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500">읽기 시간</div>
              <div className="font-mono font-semibold">{stats.readingTime}분</div>
            </div>
            <div>
              <div className="text-slate-500">문장당 글자</div>
              <div className="font-mono font-semibold">{stats.avgCharsPerSentence}</div>
            </div>
            <div>
              <div className="text-slate-500">문단당 문장</div>
              <div className="font-mono font-semibold">{stats.avgSentencesPerParagraph}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}