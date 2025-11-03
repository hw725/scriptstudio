
import React from 'react';
import { DataProvider } from '@/components/providers/DataProvider';

export default function Layout({ children }) {
  return (
    <DataProvider>
      <div className="h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
        <style>{`
          @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-gov.min.css");
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500;600;700;900&display=swap');
          
          :root {
            --background: 240 10% 99%;
            --foreground: 240 10% 3.9%;
            --card: 0 0% 100%;
            --card-foreground: 240 10% 3.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 240 10% 3.9%;
            --primary: 140 60% 25%;
            --primary-foreground: 0 0% 98%;
            --secondary: 142 20% 92%;
            --secondary-foreground: 142 30% 15%;
            --muted: 142 15% 94%;
            --muted-foreground: 142 20% 40%;
            --accent: 142 25% 88%;
            --accent-foreground: 142 40% 20%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 0 0% 98%;
            --border: 142 20% 85%;
            --input: 142 20% 88%;
            --ring: 140 60% 25%;
            --radius: 0.5rem;
            
            /* 폰트 설정 */
            --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
            --font-serif: "Noto Serif KR", serif;
          }
          
          /* 기본 폰트는 모두 산세리프 */
          * {
            font-family: var(--font-sans);
          }
          
          /* 읽기 모드에서 세리프 선택 시 */
          .prose.font-serif {
            font-family: var(--font-serif) !important;
          }
        `}</style>
        {children}
      </div>
    </DataProvider>
  );
}
