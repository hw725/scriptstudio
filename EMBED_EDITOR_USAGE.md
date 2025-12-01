# Embed Editor 연동 가이드

## URL
배포 후: `https://studio725.vercel.app/embed-editor`

## Base44에서 iframe으로 연동하는 방법

### 1. iframe 삽입
```jsx
<iframe
  ref={iframeRef}
  src="https://studio725.vercel.app/embed-editor"
  style={{ width: '100%', height: '500px', border: 'none' }}
  title="Script Studio Editor"
/>
```

### 2. postMessage로 콘텐츠 전송 (Base44 → 에디터)

```javascript
// note.content를 에디터에 설정
iframeRef.current.contentWindow.postMessage({
  type: 'SET_CONTENT',
  content: note.content || ''
}, '*');

// 또는 현재 커서 위치에 삽입
iframeRef.current.contentWindow.postMessage({
  type: 'INSERT_CONTENT',
  content: '<p>삽입할 내용</p>'
}, '*');
```

### 3. postMessage로 콘텐츠 수신 (에디터 → Base44)

```javascript
useEffect(() => {
  const handleMessage = (event) => {
    // origin 검증 (보안)
    if (event.origin !== 'https://studio725.vercel.app') return;
    
    const { type, content } = event.data || {};
    
    if (type === 'CONTENT_UPDATE') {
      // 에디터에서 변경된 내용
      setContent(content);
      // 자동저장 등 처리
    }
    
    if (type === 'EDITOR_READY') {
      // 에디터 준비 완료 - 이때 SET_CONTENT 호출
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_CONTENT',
        content: initialContent
      }, '*');
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

## 지원하는 메시지 타입

### Base44 → 에디터 (요청)

| type | 설명 | content |
|------|------|---------|
| `SET_CONTENT` | 전체 콘텐츠 설정 | HTML 문자열 |
| `INSERT_CONTENT` | 커서 위치에 삽입 | HTML 문자열 |
| `GET_CONTENT` | 현재 콘텐츠 요청 | - |
| `FOCUS` | 에디터 포커스 | - |
| `BLUR` | 에디터 블러 | - |
| `SET_EDITABLE` | 편집 가능 여부 | boolean |
| `PING` | 연결 확인 | - |

### 에디터 → Base44 (응답)

| type | 설명 | 데이터 |
|------|------|--------|
| `EDITOR_READY` | 에디터 준비 완료 | `{ ready: true }` |
| `CONTENT_UPDATE` | 콘텐츠 변경됨 | `{ content: HTML }` |
| `CONTENT_RESPONSE` | GET_CONTENT 응답 | `{ content: HTML }` |
| `PONG` | PING 응답 | `{ ready: true }` |

## 전체 연동 예제 (Base44용)

```jsx
import { useEffect, useRef, useState } from 'react';

export default function TiptapEditor({ note, setContent }) {
  const iframeRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      // 보안을 위한 origin 검증
      if (event.origin !== 'https://studio725.vercel.app') return;
      
      const { type, content, ready } = event.data || {};
      
      switch (type) {
        case 'EDITOR_READY':
          setIsEditorReady(true);
          // 에디터가 준비되면 기존 콘텐츠 로드
          if (note?.content) {
            iframeRef.current?.contentWindow?.postMessage({
              type: 'SET_CONTENT',
              content: note.content
            }, '*');
          }
          break;
          
        case 'CONTENT_UPDATE':
          // 변경된 내용을 상위 컴포넌트로 전달 (자동저장 트리거)
          setContent(content);
          break;
          
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [note?.content, setContent]);

  // note가 변경될 때 에디터에 새 콘텐츠 설정
  useEffect(() => {
    if (isEditorReady && note?.content !== undefined) {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'SET_CONTENT',
        content: note.content || ''
      }, '*');
    }
  }, [note?.id, isEditorReady]);

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        src="https://studio725.vercel.app/embed-editor"
        className="w-full h-full border-0"
        title="Script Studio Editor"
        allow="clipboard-write"
      />
    </div>
  );
}
```

## 주의사항

1. **CORS**: iframe 통신은 postMessage를 사용하므로 CORS 문제 없음
2. **보안**: origin 검증 필수 (`event.origin` 확인)
3. **타이밍**: `EDITOR_READY` 메시지를 받은 후에 `SET_CONTENT` 호출
4. **디바운스**: 에디터에서 300ms 디바운스 적용됨 (너무 빈번한 업데이트 방지)
