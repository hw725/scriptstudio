import { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Typography from "@tiptap/extension-typography";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { marked } from "marked";
import "@/components/workspace/TiptapEditor.css";

// lowlight 인스턴스 생성
const lowlight = createLowlight(common);

// marked 설정 - GFM(GitHub Flavored Markdown) 활성화
marked.setOptions({
  gfm: true,
  breaks: true, // 줄바꿈을 <br>로 변환
});

// 콘텐츠가 HTML인지 Markdown인지 감지
function isHtml(content) {
  if (!content || typeof content !== "string") return false;
  // HTML 태그가 포함되어 있으면 HTML로 간주
  const htmlTagPattern = /<\/?[a-z][\s\S]*>/i;
  return htmlTagPattern.test(content);
}

// Markdown을 HTML로 변환 (이미 HTML이면 그대로 반환)
function parseContent(content) {
  if (!content) return "";
  if (isHtml(content)) {
    return content;
  }
  // Markdown을 HTML로 변환
  return marked.parse(content);
}

// Base44와 통신할 허용된 origin들
const ALLOWED_ORIGINS = [
  "https://app.base44.com",
  "https://base44.com",
  "http://localhost:3000",
  "http://localhost:5173",
  "*", // 개발 중에는 모든 origin 허용 (배포 시 제거 가능)
];

function isAllowedOrigin(origin) {
  return ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin);
}

export default function EmbedEditor() {
  const [isReady, setIsReady] = useState(false);
  const parentOriginRef = useRef("*");
  const debounceTimerRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 bg-gray-50 px-4 py-2 font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 px-4 py-2",
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: "not-prose pl-2",
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: "flex items-start gap-2",
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class:
            "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto",
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none",
        spellcheck: "false",
        autocorrect: "off",
        autocapitalize: "off",
        autocomplete: "off",
        "data-gramm": "false",
        "data-gramm_editor": "false",
        "data-enable-grammarly": "false",
        "data-lt-active": "false",
      },
    },
    onUpdate: ({ editor }) => {
      // 디바운스를 적용하여 너무 자주 메시지를 보내지 않도록 함
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        sendMessageToParent("CONTENT_UPDATE", { content: html });
      }, 300);
    },
  });

  // 부모 창으로 메시지 전송
  const sendMessageToParent = useCallback((type, data = {}) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, ...data }, parentOriginRef.current);
    }
  }, []);

  // Base44에서 메시지 수신
  useEffect(() => {
    const handleMessage = (event) => {
      // origin 검증
      if (!isAllowedOrigin(event.origin)) {
        console.warn("Unauthorized origin:", event.origin);
        return;
      }

      // 부모 origin 저장
      if (event.origin !== "*") {
        parentOriginRef.current = event.origin;
      }

      const { type, content } = event.data || {};

      if (!editor) return;

      switch (type) {
        case "SET_CONTENT": {
          // Markdown 또는 HTML 콘텐츠를 파싱하여 설정
          const parsedContent = parseContent(content);
          editor.commands.setContent(parsedContent || "");
          break;
        }

        case "INSERT_CONTENT": {
          // 현재 커서 위치에 콘텐츠 삽입 (Markdown 지원)
          const parsedInsertContent = parseContent(content);
          editor
            .chain()
            .focus()
            .insertContent(parsedInsertContent || "")
            .run();
          break;
        }

        case "GET_CONTENT":
          // 현재 콘텐츠 요청에 대한 응답
          sendMessageToParent("CONTENT_RESPONSE", {
            content: editor.getHTML(),
          });
          break;

        case "FOCUS":
          // 에디터에 포커스
          editor.chain().focus().run();
          break;

        case "BLUR":
          // 에디터 블러
          editor.commands.blur();
          break;

        case "SET_EDITABLE":
          // 편집 가능 여부 설정
          editor.setEditable(content !== false);
          break;

        case "PING":
          // 연결 확인용
          sendMessageToParent("PONG", { ready: true });
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editor, sendMessageToParent]);

  // 에디터 준비 완료 알림
  useEffect(() => {
    if (editor && !isReady) {
      setIsReady(true);
      sendMessageToParent("EDITOR_READY", { ready: true });
    }
  }, [editor, isReady, sendMessageToParent]);

  // 언마운트 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (!editor) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="text-gray-500">에디터 로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      {/* 글로벌 스타일 */}
      <style>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-gov.min.css");
        
        :root {
          --font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;
        }
        
        * {
          font-family: var(--font-sans);
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
      `}</style>

      {/* 툴바 */}
      <div className="flex flex-wrap gap-0.5 p-1 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200 flex-shrink-0">
        {/* 텍스트 서식 */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-7 h-7 text-xs rounded-md flex items-center justify-center font-semibold transition-all shadow-sm ${
            editor.isActive("bold")
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white hover:bg-gray-100 text-gray-700"
          }`}
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-7 h-7 text-xs rounded-md flex items-center justify-center italic transition-all shadow-sm ${
            editor.isActive("italic")
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white hover:bg-gray-100 text-gray-700"
          }`}
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`w-7 h-7 text-xs rounded-md flex items-center justify-center line-through transition-all shadow-sm ${
            editor.isActive("strike")
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white hover:bg-gray-100 text-gray-700"
          }`}
          title="Strikethrough"
        >
          S
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`w-7 h-7 text-xs rounded-md flex items-center justify-center font-mono text-sm transition-all shadow-sm ${
            editor.isActive("code")
              ? "bg-blue-500 text-white shadow-md"
              : "bg-white hover:bg-gray-100 text-gray-700"
          }`}
          title="Inline Code"
        >
          {"<>"}
        </button>

        {/* 헤딩 */}
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            className={`w-8 h-7 text-xs rounded ${
              editor.isActive("heading", { level })
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}

        {/* 리스트 */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-7 h-7 text-sm rounded ${
            editor.isActive("bulletList")
              ? "bg-gray-900 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
          title="Bullet List"
        >
          {"•"}
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-7 h-7 text-sm rounded ${
            editor.isActive("orderedList")
              ? "bg-gray-900 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
          title="Numbered List"
        >
          {"①"}
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`w-7 h-7 text-sm rounded ${
            editor.isActive("taskList")
              ? "bg-gray-900 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
          title="Task List"
        >
          {"☑"}
        </button>

        {/* 코드 블록 & 인용 */}
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`w-7 h-7 text-xs rounded ${
            editor.isActive("codeBlock")
              ? "bg-gray-900 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
          title="Code Block"
        >
          {"{}"}
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`w-7 h-7 text-sm rounded ${
            editor.isActive("blockquote")
              ? "bg-gray-900 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
          title="Blockquote"
        >
          {"❝"}
        </button>

        {/* 링크 */}
        <button
          onClick={() => {
            const url = window.prompt("URL:");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`w-7 h-7 text-sm rounded ${
            editor.isActive("link")
              ? "bg-gray-900 text-white"
              : "bg-white hover:bg-gray-100"
          }`}
          title="Add Link"
        >
          {"🔗"}
        </button>

        {/* 테이블 */}
        <button
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={`w-7 h-7 text-sm rounded bg-white hover:bg-gray-100`}
          title="Insert Table"
        >
          {"⊞"}
        </button>
        {editor.isActive("table") && (
          <>
            <button
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className={`px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 text-xs`}
              title="Add Column"
            >
              {"+C"}
            </button>
            <button
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className={`px-1.5 py-0.5 rounded bg-white hover:bg-gray-100 text-xs`}
              title="Add Row"
            >
              {"+R"}
            </button>
            <button
              onClick={() => editor.chain().focus().deleteTable().run()}
              className={`w-7 h-7 text-xs rounded bg-white hover:bg-gray-100`}
              title="Delete Table"
            >
              {"✕"}
            </button>
          </>
        )}

        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`w-7 h-7 text-sm rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`w-7 h-7 text-sm rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </div>

      {/* 에디터 영역 */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
