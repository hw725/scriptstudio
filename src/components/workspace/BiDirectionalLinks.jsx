
import React, { useMemo, useCallback } from 'react';
import { useData } from '@/components/providers/DataProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, FileText, ExternalLink, SquareStack } from 'lucide-react'; // SquareStack 추가

const MAX_EMBED_DEPTH = 2; // 무한 임베드 방지

// 양방향 링크 및 임베드를 실제 콘텐츠로 변환하는 함수
export const renderLinksInContent = (content, allNotes, currentProjectId = null, depth = 0) => {
  if (!content || !allNotes) return content;
  
  if (depth > MAX_EMBED_DEPTH) {
    return '<div class="p-2 border-l-4 border-red-500 bg-red-50 text-sm text-red-700">최대 임베드 깊이를 초과했습니다.</div>';
  }

  // ![[임베드]] 와 [[링크]] 패턴을 모두 처리하는 정규식
  // Captures: 1 (optional '!'), 2 (link text)
  return content.replace(/(!?)\[\[([^\]]+)\]\]/g, (match, embedChar, linkText) => {
    let targetNote = null;
    
    // 1. 현재 프로젝트에서 먼저 찾기 (currentProjectId가 있을 경우)
    if (currentProjectId) {
      targetNote = allNotes.find(note => 
        note.project_id === currentProjectId && 
        note.title.toLowerCase() === linkText.toLowerCase()
      );
    }
    
    // 2. 프로젝트가 없는 노트 중에서 찾기
    if (!targetNote) {
      targetNote = allNotes.find(note => 
        !note.project_id && 
        note.title.toLowerCase() === linkText.toLowerCase()
      );
    }
    
    // 3. 다른 모든 프로젝트에서 찾기
    if (!targetNote) {
      targetNote = allNotes.find(note => 
        note.title.toLowerCase() === linkText.toLowerCase()
      );
    }

    if (!targetNote) {
      // 문서를 찾을 수 없는 경우
      return `<span style="color: #ef4444; text-decoration: none; cursor: help;" title="문서를 찾을 수 없습니다: ${linkText}">${linkText}</span>`;
    }
    
    // 임베드('!') 문자가 있는 경우
    if (embedChar === '!') {
      const embeddedContent = renderLinksInContent(targetNote.content || '', allNotes, targetNote.project_id, depth + 1);
      return `
        <div class="my-4 p-4 border rounded-lg bg-slate-50/50">
          <h4 class="text-sm font-semibold mb-2 pb-2 border-b">
            <a href="#" class="bidirectional-link" data-note-id="${targetNote.id}" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">${targetNote.title}</a>
          </h4>
          <div class="prose prose-sm max-w-none">${embeddedContent}</div>
        </div>
      `;
    }
    
    // 일반 링크의 경우
    return `<a href="#" class="bidirectional-link" data-note-id="${targetNote.id}" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">${linkText}</a>`;
  });
};

// 현재 문서와 연결된 링크들을 찾는 함수
const findBidirectionalLinks = (currentNote, allNotes, currentProjectId) => {
  if (!currentNote || !allNotes) return { outbound: [], inbound: [] };

  const currentTitle = currentNote.title?.toLowerCase() || '';
  
  // 나가는 링크 (임베드 포함)
  // 정규식 변경: `(!?)`를 추가하여 옵션으로 '!' 문자를 찾음
  const outboundMatches = currentNote.content?.match(/(!?)\[\[([^\]]+)\]\]/g) || [];
  const outbound = outboundMatches
    .map(match => {
      // '!' 문자로 시작하면 임베드
      const isEmbed = match.startsWith('!');
      // '!'와 [[ ]]를 제거하여 실제 링크 텍스트 추출
      const linkText = match.replace(/!?\[\[|\]\]/g, '');
      return { isEmbed, linkText };
    })
    .map(({ isEmbed, linkText }) => { // isEmbed와 linkText를 구조 분해 할당
      let targetNote = null;
    
      // 1. 현재 프로젝트에서 먼저 찾기 (currentProjectId가 있을 경우)
      if (currentProjectId) {
        targetNote = allNotes.find(note => 
          note.project_id === currentProjectId && 
          note.title.toLowerCase() === linkText.toLowerCase()
        );
      }
      
      // 2. 프로젝트가 없는 노트 중에서 찾기
      if (!targetNote) {
        targetNote = allNotes.find(note => 
          !note.project_id && 
          note.title.toLowerCase() === linkText.toLowerCase()
        );
      }
      
      // 3. 다른 모든 프로젝트에서 찾기
      if (!targetNote) {
        targetNote = allNotes.find(note => 
          note.title.toLowerCase() === linkText.toLowerCase()
        );
      }

      return targetNote ? { 
        ...targetNote, 
        linkText, 
        isEmbed, // 임베드 여부 추가
        exists: true 
      } : { 
        title: linkText, 
        linkText, 
        isEmbed, // 임베드 여부 추가
        exists: false 
      };
    })
    .filter((note, index, self) => 
      // 중복된 링크 텍스트 필터링
      self.findIndex(n => n.linkText === note.linkText) === index
    );

  // 현재 문서로 들어오는 링크 (인바운드)
  const inbound = allNotes
    .filter(note => note.id !== currentNote.id)
    .filter(note => {
      const content = note.content || '';
      const escapedTitle = currentTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 정규식 변경: `!?`를 추가하여 `![[제목]]` 형태도 찾을 수 있도록 함
      const linkPattern = new RegExp(`!?\\[\\[${escapedTitle}\\]\\]`, 'i');
      return linkPattern.test(content);
    });

  return { outbound, inbound };
};

export default function BiDirectionalLinks({ currentNote, onNavigateToNote }) {
  const { allNotes, currentProject } = useData();

  const { outbound, inbound } = useMemo(() => {
    return findBidirectionalLinks(currentNote, allNotes, currentProject?.id);
  }, [currentNote, allNotes, currentProject?.id]);

  const handleLinkClick = useCallback((note) => {
    if (note.exists !== false && note.id) {
      onNavigateToNote(note.id);
    }
  }, [onNavigateToNote]);

  return (
    <div className="h-full flex flex-col bg-slate-50/50 border-l border-slate-200">
      <div className="h-12 px-4 py-3 border-b border-slate-200 bg-white flex items-center">
        <Link2 className="h-4 w-4 mr-2 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-800">양방향 링크</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 나가는 링크 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              참조하는 문서 ({outbound.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {outbound.length === 0 ? (
              <p className="text-xs text-slate-500">다른 문서를 참조하지 않습니다.</p>
            ) : (
              <div className="space-y-2">
                {outbound.map((note, index) => (
                  <div 
                    // note.id가 없을 수 있으므로 (존재하지 않는 링크) title과 index를 조합하여 키 생성
                    key={`${note.id || note.title}-${index}`} 
                    onClick={() => handleLinkClick(note)}
                    className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
                      note.exists === false 
                        ? 'bg-red-50 text-red-700 cursor-not-allowed' 
                        : 'bg-slate-50 hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    {/* 임베드 여부에 따라 아이콘 변경 */}
                    {note.isEmbed ? (
                      <SquareStack className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    ) : (
                      <FileText className="h-4 w-4 flex-shrink-0 text-slate-500" />
                    )}
                    <span className="truncate flex-1">{note.title}</span>
                    {note.exists === false && (
                      <Badge variant="destructive" className="text-xs">존재하지 않음</Badge>
                    )}
                    {note.isEmbed && ( // 임베드인 경우 뱃지 추가
                      <Badge variant="secondary" className="text-xs">임베드</Badge>
                    )}
                    {note.exists !== false && note.project_id && currentProject?.id !== note.project_id && (
                      <Badge variant="outline" className="text-xs">다른 프로젝트</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 들어오는 링크 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4 scale-x-[-1]" />
              참조되는 문서 ({inbound.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {inbound.length === 0 ? (
              <p className="text-xs text-slate-500">이 문서를 참조하는 문서가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {inbound.map((note) => (
                  <div 
                    key={note.id}
                    onClick={() => handleLinkClick(note)}
                    className="flex items-center gap-2 p-2 rounded-md bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm transition-colors"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate flex-1">{note.title}</span>
                    {note.project_id && currentProject?.id !== note.project_id && (
                      <Badge variant="outline" className="text-xs">다른 프로젝트</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
