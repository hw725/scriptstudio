import React, { useEffect, useState } from 'react';

export default function TableOfContentsPanel({ content, editorContainerRef }) {
  const [headings, setHeadings] = useState([]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3');
    
    const newHeadings = Array.from(headingElements).map((el, index) => {
      const text = el.innerText.trim();
      const level = parseInt(el.tagName.substring(1), 10);
      
      return { 
        id: `heading-${index}`, 
        text, 
        level,
        originalText: text // 검색에 사용할 원본 텍스트
      };
    });

    setHeadings(newHeadings);
  }, [content]);

  const handleHeadingClick = (heading) => {
    if (!editorContainerRef.current || !heading.originalText) return;
    
    try {
      const editorElement = editorContainerRef.current;
      const quillEditor = editorElement.querySelector('.ql-editor');
      
      if (!quillEditor) return;

      // 모든 헤딩 요소를 찾고 텍스트가 일치하는 것을 찾기
      const allHeadings = quillEditor.querySelectorAll('h1, h2, h3');
      
      for (let i = 0; i < allHeadings.length; i++) {
        const headingEl = allHeadings[i];
        if (headingEl.innerText.trim() === heading.originalText) {
          // 해당 요소로 스크롤
          headingEl.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
          
          // 약간의 여백을 위해 추가 조정
          setTimeout(() => {
            const rect = headingEl.getBoundingClientRect();
            const editorRect = editorElement.getBoundingClientRect();
            
            if (rect.top < editorRect.top + 100) { // 상단 여백 확보
              editorElement.scrollBy(0, -80);
            }
          }, 100);
          
          break;
        }
      }
    } catch (e) {
      console.error('목차 이동 중 오류:', e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50 border-l border-slate-200">
      <div className="h-12 px-4 py-3 border-b border-slate-200 bg-white flex items-center">
        <h3 className="text-sm font-semibold text-slate-800">목차</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {headings.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <p className="text-sm">문서에 제목(H1, H2, H3)이 없습니다.</p>
            <p className="text-xs mt-2 text-slate-400">에디터 툴바를 사용하여 제목을 추가하세요.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {headings.map(heading => (
              <li key={heading.id}>
                <button
                  onClick={() => handleHeadingClick(heading)}
                  className="w-full text-left block text-sm text-slate-700 hover:text-primary hover:bg-slate-200/50 rounded-md transition-colors p-2"
                  style={{ paddingLeft: `${(heading.level - 1) * 16 + 8}px` }}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}