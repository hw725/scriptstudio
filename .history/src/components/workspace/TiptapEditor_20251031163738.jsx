import { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  FootnoteReference,
  FootnoteDefinition,
  FootnotesSection,
  footnoteHelpers,
} from "./FootnoteExtension";
import "./TiptapEditor.css";

// lowlight 인스턴스 생성
const lowlight = createLowlight(common);

const TiptapEditor = forwardRef(
  (
    {
      content = "",
      onChange,
      onKeyDown,
      placeholder = "노트를 작성하세요...",
      disabled = false,
    },
    ref
  ) => {
    const [isCompact, setIsCompact] = useState(false);
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: false, // CodeBlockLowlight 사용
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
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
        FootnoteReference,
        FootnoteDefinition,
        FootnotesSection,
      ],
      content: content || "<p>여기에 내용을 입력하세요...</p>",
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none",
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange?.(html);
      },
    });

    // ref를 통해 editor 인스턴스와 유용한 메서드들 노출
    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editor,
        insertText: (text, position) => {
          if (editor) {
            if (position !== undefined) {
              editor.chain().focus().insertContentAt(position, text).run();
            } else {
              editor.chain().focus().insertContent(text).run();
            }
          }
        },
        getSelection: () => {
          if (editor) {
            const { from, to } = editor.state.selection;
            return { index: from, length: to - from };
          }
          return null;
        },
        getText: (from = 0, to) => {
          if (editor) {
            const text = editor.state.doc.textContent;
            return to !== undefined
              ? text.substring(from, to)
              : text.substring(from);
          }
          return "";
        },
        setSelection: (position) => {
          if (editor) {
            editor.chain().focus().setTextSelection(position).run();
          }
        },
        deleteText: (from, length) => {
          if (editor) {
            editor
              .chain()
              .focus()
              .deleteRange({ from, to: from + length })
              .run();
          }
        },
      }),
      [editor]
    );

    // content prop이 변경될 때 에디터 업데이트 (외부 변경 반영)
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content, false);
      }
    }, [content, editor]);

    if (!editor) {
      return (
        <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">
          <div className="p-8 text-center text-gray-500">에디터 로딩 중...</div>
        </div>
      );
    }

    return (
      <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">
        {/* 컴팩트 모드 토글 */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-gray-200">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
            title={isCompact ? "툴바 확장" : "툴바 축소"}
          >
            {isCompact ? "▶ 툴바 확장" : "◀ 툴바 축소"}
          </button>
          <span className="text-xs text-gray-400">번역 모드 대응</span>
        </div>
        {/* 툴바 */}
        <div className={`flex flex-wrap ${isCompact ? "gap-0.5 p-1.5" : "gap-1.5 p-2.5"} bg-gradient-to-b from-gray-50 to-white border-b border-gray-200`}>
          {/* 텍스트 서식 */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${isCompact ? "w-7 h-7 text-xs" : "w-9 h-9"} rounded-md flex items-center justify-center font-semibold transition-all shadow-sm ${
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
            className={`${isCompact ? "w-7 h-7 text-xs" : "w-9 h-9"} rounded-md flex items-center justify-center italic transition-all shadow-sm ${
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
            className={`${isCompact ? "w-7 h-7 text-xs" : "w-9 h-9"} rounded-md flex items-center justify-center line-through transition-all shadow-sm ${
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
            className={`${isCompact ? "w-7 h-7 text-xs" : "w-9 h-9"} rounded-md flex items-center justify-center font-mono text-sm transition-all shadow-sm ${
              editor.isActive("code")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Inline Code"
          >
            {"<>"}
          </button>

          {!isCompact && <div className="w-px h-9 bg-gray-300 mx-1" />}

          {/* 헤딩 */}
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
              className={`${isCompact ? "w-8 h-7 text-xs" : "px-3 py-1"} rounded ${
                editor.isActive("heading", { level })
                  ? "bg-gray-900 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
              title={`Heading ${level}`}
            >
              H{level}
            </button>
          ))}

          {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

          {/* 리스트 */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded ${
              editor.isActive("bulletList")
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Bullet List"
          >
            {isCompact ? "•" : "• List"}
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded ${
              editor.isActive("orderedList")
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Numbered List"
          >
            {isCompact ? "①" : "1. List"}
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded ${
              editor.isActive("taskList")
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Task List"
          >
            {isCompact ? "☑" : "☑ Task"}
          </button>

          {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

          {/* 코드 블록 & 인용 */}
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`${isCompact ? "w-7 h-7 text-xs" : "px-3 py-1"} rounded ${
              editor.isActive("codeBlock")
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Code Block"
          >
            {isCompact ? "{}" : "<Code/>"}
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded ${
              editor.isActive("blockquote")
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Blockquote"
          >
            {isCompact ? "❝" : "Quote"}
          </button>

          {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

          {/* 링크 */}
          <button
            onClick={() => {
              const url = window.prompt("URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded ${
              editor.isActive("link")
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-100"
            }`}
            title="Add Link"
          >
            {isCompact ? "🔗" : "🔗 Link"}
          </button>
          {!isCompact && editor.isActive("link") && (
            <button
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="px-3 py-1 rounded bg-white hover:bg-gray-100"
              title="Remove Link"
            >
              🔗✕
            </button>
          )}

          {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

          {/* 테이블 */}
          <button
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded bg-white hover:bg-gray-100`}
            title="Insert Table"
          >
            {isCompact ? "⊞" : "⊞ Table"}
          </button>
          {editor.isActive("table") && (
            <>
              <button
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className={`${isCompact ? "px-1.5 py-0.5" : "px-2 py-1"} rounded bg-white hover:bg-gray-100 text-xs`}
                title="Add Column"
              >
                {isCompact ? "+C" : "+Col"}
              </button>
              <button
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className={`${isCompact ? "px-1.5 py-0.5" : "px-2 py-1"} rounded bg-white hover:bg-gray-100 text-xs`}
                title="Add Row"
              >
                {isCompact ? "+R" : "+Row"}
              </button>
              <button
                onClick={() => editor.chain().focus().deleteTable().run()}
                className={`${isCompact ? "w-7 h-7 text-xs" : "px-2 py-1"} rounded bg-white hover:bg-gray-100 text-xs`}
                title="Delete Table"
              >
                {isCompact ? "✕" : "✕Table"}
              </button>
            </>
          )}

          {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

          {/* 구분선 */}
          {!isCompact && (
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="px-3 py-1 rounded bg-white hover:bg-gray-100"
              title="Horizontal Rule"
            >
              ─
            </button>
          )}

          {/* 각주: 참조 + 정의(섹션) 자동 추가 */}
          <button
            onClick={() => {
              footnoteHelpers.addFootnote(editor);
            }}
            className={`${isCompact ? "w-7 h-7 text-xs" : "px-3 py-1"} rounded bg-white hover:bg-gray-100`}
            title="Insert Footnote (GFM)"
          >
            [^]
          </button>

          {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`${isCompact ? "w-7 h-7 text-sm" : "px-3 py-1"} rounded bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
        </div>

        {/* 에디터 영역 */}
        <div className="p-4 bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";

export default TiptapEditor;
