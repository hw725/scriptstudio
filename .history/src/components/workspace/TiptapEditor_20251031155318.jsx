import { useEffect, useImperativeHandle, forwardRef, useState } from "react";import { useEffect, useImperativeHandle, forwardRef, useState } from "react";

import { useEditor, EditorContent } from "@tiptap/react";import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";import StarterKit from "@tiptap/starter-kit";

import Link from "@tiptap/extension-link";import Link from "@tiptap/extension-link";

import Image from "@tiptap/extension-image";import Image from "@tiptap/extension-image";

import { Table } from "@tiptap/extension-table";import { Table } from "@tiptap/extension-table";

import { TableRow } from "@tiptap/extension-table-row";import { TableRow } from "@tiptap/extension-table-row";

import { TableCell } from "@tiptap/extension-table-cell";import { TableCell } from "@tiptap/extension-table-cell";

import { TableHeader } from "@tiptap/extension-table-header";import { TableHeader } from "@tiptap/extension-table-header";

import TaskList from "@tiptap/extension-task-list";import TaskList from "@tiptap/extension-task-list";

import TaskItem from "@tiptap/extension-task-item";import TaskItem from "@tiptap/extension-task-item";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import { common, createLowlight } from "lowlight";import { common, createLowlight } from "lowlight";

import { FootnoteReference, FootnoteDefinition } from "./FootnoteExtension";import { FootnoteReference, FootnoteDefinition } from "./FootnoteExtension";



const lowlight = createLowlight(common);// lowlight 인스턴스 생성

const lowlight = createLowlight(common);

const TiptapEditor = forwardRef(

  (const TiptapEditor = forwardRef(

    {  (

      content = "",    {

      onChange,      content = "",

      onKeyDown,      onChange,

      placeholder = "노트를 작성하세요...",      onKeyDown,

      disabled = false,      placeholder = "노트를 작성하세요...",

    },      disabled = false,

    ref    },

  ) => {    ref

    const [isCompact, setIsCompact] = useState(false);  ) => {

        const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);

    const editor = useEditor({    

      extensions: [    const editor = useEditor({

        StarterKit.configure({      extensions: [

          codeBlock: false,        StarterKit.configure({

          heading: { levels: [1, 2, 3, 4, 5, 6] },          codeBlock: false, // CodeBlockLowlight 사용

        }),          heading: {

        Link.configure({            levels: [1, 2, 3, 4, 5, 6],

          openOnClick: false,          },

          HTMLAttributes: { class: "text-blue-600 hover:underline" },        }),

        }),        Link.configure({

        Image.configure({          openOnClick: false,

          HTMLAttributes: { class: "max-w-full h-auto" },          HTMLAttributes: {

        }),            class: "text-blue-600 hover:underline",

        Table.configure({          },

          resizable: true,        }),

          HTMLAttributes: { class: "border-collapse table-auto w-full" },        Image.configure({

        }),          HTMLAttributes: {

        TableRow,            class: "max-w-full h-auto",

        TableHeader.configure({          },

          HTMLAttributes: { class: "border border-gray-300 bg-gray-50 px-4 py-2 font-semibold" },        }),

        }),        Table.configure({

        TableCell.configure({          resizable: true,

          HTMLAttributes: { class: "border border-gray-300 px-4 py-2" },          HTMLAttributes: {

        }),            class: "border-collapse table-auto w-full",

        TaskList.configure({          },

          HTMLAttributes: { class: "not-prose pl-2" },        }),

        }),        TableRow,

        TaskItem.configure({        TableHeader.configure({

          nested: true,          HTMLAttributes: {

          HTMLAttributes: { class: "flex items-start gap-2" },            class: "border border-gray-300 bg-gray-50 px-4 py-2 font-semibold",

        }),          },

        CodeBlockLowlight.configure({        }),

          lowlight,        TableCell.configure({

          HTMLAttributes: { class: "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto" },          HTMLAttributes: {

        }),            class: "border border-gray-300 px-4 py-2",

        FootnoteReference,          },

        FootnoteDefinition,        }),

      ],        TaskList.configure({

      content: content || "<p>여기에 내용을 입력하세요...</p>",          HTMLAttributes: {

      editorProps: {            class: "not-prose pl-2",

        attributes: { class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none" },          },

      },        }),

      onUpdate: ({ editor }) => {        TaskItem.configure({

        onChange?.(editor.getHTML());          nested: true,

      },          HTMLAttributes: {

    });            class: "flex items-start gap-2",

          },

    useImperativeHandle(        }),

      ref,        CodeBlockLowlight.configure({

      () => ({          lowlight,

        getEditor: () => editor,          HTMLAttributes: {

        insertText: (text, position) => {            class:

          if (editor) {              "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto",

            if (position !== undefined) {          },

              editor.chain().focus().insertContentAt(position, text).run();        }),

            } else {        FootnoteReference,

              editor.chain().focus().insertContent(text).run();        FootnoteDefinition,

            }      ],

          }      content: content || "<p>여기에 내용을 입력하세요...</p>",

        },      editorProps: {

        getSelection: () => {        attributes: {

          if (editor) {          class:

            const { from, to } = editor.state.selection;            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none",

            return { index: from, length: to - from };        },

          }      },

          return null;      onUpdate: ({ editor }) => {

        },        const html = editor.getHTML();

        getText: (from = 0, to) => {        onChange?.(html);

          if (editor) {      },

            const text = editor.state.doc.textContent;    });

            return to !== undefined ? text.substring(from, to) : text.substring(from);

          }    // ref를 통해 editor 인스턴스와 유용한 메서드들 노출

          return "";    useImperativeHandle(

        },      ref,

        setSelection: (position) => {      () => ({

          if (editor) {        getEditor: () => editor,

            editor.chain().focus().setTextSelection(position).run();        insertText: (text, position) => {

          }          if (editor) {

        },            if (position !== undefined) {

        deleteText: (from, length) => {              editor.chain().focus().insertContentAt(position, text).run();

          if (editor) {            } else {

            editor.chain().focus().deleteRange({ from, to: from + length }).run();              editor.chain().focus().insertContent(text).run();

          }            }

        },          }

      }),        },

      [editor]        getSelection: () => {

    );          if (editor) {

            const { from, to } = editor.state.selection;

    useEffect(() => {            return { index: from, length: to - from };

      if (editor && content !== editor.getHTML()) {          }

        editor.commands.setContent(content, false);          return null;

      }        },

    }, [content, editor]);        getText: (from = 0, to) => {

          if (editor) {

    if (!editor) {            const text = editor.state.doc.textContent;

      return (            return to !== undefined

        <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">              ? text.substring(from, to)

          <div className="p-8 text-center text-gray-500">에디터 로딩 중...</div>              : text.substring(from);

        </div>          }

      );          return "";

    }        },

        setSelection: (position) => {

    const btnSize = isCompact ? "w-7 h-7" : "w-8 h-8";          if (editor) {

    const gap = isCompact ? "gap-0.5" : "gap-1";            editor.chain().focus().setTextSelection(position).run();

    const padding = isCompact ? "p-1" : "p-2";          }

    const btnClass = (active) => `${btnSize} rounded flex items-center justify-center text-xs transition-all ${active ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100 text-gray-700"}`;        },

        deleteText: (from, length) => {

    return (          if (editor) {

      <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">            editor

        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">              .chain()

          <div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b border-gray-200">              .focus()

            <button onClick={() => setIsCompact(!isCompact)} className="text-xs text-gray-600 hover:text-gray-900" title={isCompact ? "확장" : "축소"}>              .deleteRange({ from, to: from + length })

              {isCompact ? "▶ 확장" : "◀ 축소"}              .run();

            </button>          }

            <span className="text-xs text-gray-400">번역 모드용 컴팩트 툴바</span>        },

          </div>      }),

      [editor]

          <div className={`flex flex-wrap items-center ${gap} ${padding}`}>    );

            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnClass(editor.isActive("bold"))} font-bold`} title="Bold">B</button>

            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnClass(editor.isActive("italic"))} italic`} title="Italic">I</button>    // content prop이 변경될 때 에디터 업데이트 (외부 변경 반영)

            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnClass(editor.isActive("strike"))} line-through`} title="Strike">S</button>    useEffect(() => {

            <button onClick={() => editor.chain().focus().toggleCode().run()} className={`${btnClass(editor.isActive("code"))} font-mono`} title="Code">&lt;&gt;</button>      if (editor && content !== editor.getHTML()) {

                    editor.commands.setContent(content, false);

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}      }

                }, [content, editor]);

            {[1, 2, 3].map(level => (

              <button key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} className={`${btnClass(editor.isActive("heading", { level }))} font-semibold`} title={`H${level}`}>H{level}</button>    if (!editor) {

            ))}      return (

                    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}          <div className="p-8 text-center text-gray-500">에디터 로딩 중...</div>

                    </div>

            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Bullet">•</button>      );

            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Numbered">①</button>    }

            <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={btnClass(editor.isActive("taskList"))} title="Task">☑</button>

                return (

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}      <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">

                    {/* 툴바 */}

            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${btnClass(editor.isActive("codeBlock"))} font-mono`} title="Code Block">&#123;&#125;</button>        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">

            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))} title="Quote">💬</button>          {/* 툴바 토글 버튼 */}

                      <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}            <button

                          onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}

            <button onClick={() => { const url = prompt("URL:"); if (url) editor.chain().focus().setLink({ href: url }).run(); }} className={btnClass(editor.isActive("link"))} title="Link">🔗</button>              className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"

                          title={isToolbarExpanded ? "툴바 접기" : "툴바 펼치기"}

            {!isCompact && (            >

              <button onClick={() => { const url = prompt("Image URL:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }} className={btnClass(false)} title="Image">🖼</button>              <span className="text-base">{isToolbarExpanded ? "▼" : "▶"}</span>

            )}              {isToolbarExpanded ? "툴바 접기" : "툴바 펼치기"}

                        </button>

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}            <span className="text-xs text-gray-400">

                          {isToolbarExpanded ? "자주 사용하는 도구" : "클릭하여 모든 도구 보기"}

            <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className={btnClass(false)} title="Table">⊞</button>            </span>

                      </div>

            {editor.isActive("table") && (

              <>          {/* 툴바 내용 */}

                <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="w-10 h-7 rounded text-xs bg-white hover:bg-gray-100" title="+col">+col</button>          {isToolbarExpanded && (

                <button onClick={() => editor.chain().focus().addRowAfter().run()} className="w-10 h-7 rounded text-xs bg-white hover:bg-gray-100" title="+row">+row</button>            <div className="flex flex-wrap gap-1.5 p-2.5">

                <button onClick={() => editor.chain().focus().deleteTable().run()} className="w-7 h-7 rounded text-sm bg-red-50 hover:bg-red-100 text-red-600" title="Delete">✕</button>              {/* 필수 도구 */}

              </>              <div className="flex flex-wrap gap-1 items-center">

            )}                {/* 텍스트 서식 */}

                            <button

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}                  onClick={() => editor.chain().focus().toggleBold().run()}

            {!isCompact && <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="HR">─</button>}                  className={`w-8 h-8 rounded flex items-center justify-center font-semibold text-xs transition-all ${

                                editor.isActive("bold")

            <button onClick={() => { const id = prompt("각주 ID:", "1"); if (id) editor.chain().focus().insertFootnoteReference(id).run(); }} className={`${btnClass(false)} font-mono`} title="Footnote">[^]</button>                      ? "bg-blue-500 text-white"

                                  : "bg-white hover:bg-gray-100 text-gray-700"

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}                  }`}

                              title="Bold (Ctrl+B)"

            <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`${btnClass(false)} disabled:opacity-30`} title="Undo">↶</button>                >

            <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`${btnClass(false)} disabled:opacity-30`} title="Redo">↷</button>                  B

          </div>                </button>

        </div>                <button

                  onClick={() => editor.chain().focus().toggleItalic().run()}

        <div className="p-4 bg-white">                  className={`w-8 h-8 rounded flex items-center justify-center italic text-xs transition-all ${

          <EditorContent editor={editor} />                    editor.isActive("italic")

        </div>                      ? "bg-blue-500 text-white"

      </div>                      : "bg-white hover:bg-gray-100 text-gray-700"

    );                  }`}

  }                  title="Italic (Ctrl+I)"

);                >

                  I

TiptapEditor.displayName = "TiptapEditor";                </button>

                

export default TiptapEditor;                <div className="w-px h-6 bg-gray-300 mx-0.5" />

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`w-9 h-9 rounded-md flex items-center justify-center line-through transition-all shadow-sm ${
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
            className={`w-9 h-9 rounded-md flex items-center justify-center font-mono text-sm transition-all shadow-sm ${
              editor.isActive("code")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Inline Code"
          >
            {"<>"}
          </button>

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* 헤딩 */}
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
              className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold transition-all shadow-sm ${
                editor.isActive("heading", { level })
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white hover:bg-gray-100 text-gray-700"
              }`}
              title={`Heading ${level}`}
            >
              H{level}
            </button>
          ))}

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* 리스트 */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`w-9 h-9 rounded-md flex items-center justify-center text-xl transition-all shadow-sm ${
              editor.isActive("bulletList")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Bullet List"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-semibold transition-all shadow-sm ${
              editor.isActive("orderedList")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Numbered List"
          >
            ①
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`w-9 h-9 rounded-md flex items-center justify-center text-lg transition-all shadow-sm ${
              editor.isActive("taskList")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Task List"
          >
            ☑
          </button>

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* 코드 블록 & 인용 */}
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`w-9 h-9 rounded-md flex items-center justify-center font-mono text-sm transition-all shadow-sm ${
              editor.isActive("codeBlock")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Code Block"
          >
            {"{ }"}
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`w-9 h-9 rounded-md flex items-center justify-center text-xl transition-all shadow-sm ${
              editor.isActive("blockquote")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Blockquote"
          >
            💬
          </button>

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* 링크 & 이미지 */}
          <button
            onClick={() => {
              const url = window.prompt("URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className={`w-9 h-9 rounded-md flex items-center justify-center text-lg transition-all shadow-sm ${
              editor.isActive("link")
                ? "bg-blue-500 text-white shadow-md"
                : "bg-white hover:bg-gray-100 text-gray-700"
            }`}
            title="Add Link"
          >
            🔗
          </button>
          {editor.isActive("link") && (
            <button
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="w-9 h-9 rounded-md flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 transition-all shadow-sm"
              title="Remove Link"
            >
              🔗✕
            </button>
          )}

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* 이미지 */}
          <button
            onClick={() => {
              const url = window.prompt("Image URL:");
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
            className="w-9 h-9 rounded-md flex items-center justify-center text-lg transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700"
            title="Add Image"
          >
            🖼
          </button>

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* 테이블 */}
          <button
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            className="w-9 h-9 rounded-md flex items-center justify-center text-lg transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700"
            title="Insert Table"
          >
            ⊞
          </button>
          {editor.isActive("table") && (
            <>
              <button
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="w-14 h-9 rounded-md flex items-center justify-center text-xs font-semibold transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700"
                title="Add Column"
              >
                +col
              </button>
              <button
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="w-14 h-9 rounded-md flex items-center justify-center text-xs font-semibold transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700"
                title="Add Row"
              >
                +row
              </button>
              <button
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="w-9 h-9 rounded-md flex items-center justify-center text-sm transition-all shadow-sm bg-red-50 hover:bg-red-100 text-red-600"
                title="Delete Table"
              >
                ✕
              </button>
            </>
          )}

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* 구분선 */}
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="w-9 h-9 rounded-md flex items-center justify-center text-lg transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700"
            title="Horizontal Rule"
          >
            ─
          </button>

          {/* 각주 */}
          <button
            onClick={() => {
              const id = prompt("각주 ID를 입력하세요 (예: 1, ref1):", "1");
              if (id) {
                editor.chain().focus().insertFootnoteReference(id).run();
              }
            }}
            className="w-11 h-9 rounded-md flex items-center justify-center text-sm font-mono transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700"
            title="Insert Footnote (GFM)"
          >
            [^]
          </button>

          <div className="w-px h-9 bg-gray-300 mx-1" />

          {/* Undo/Redo */}
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="w-9 h-9 rounded-md flex items-center justify-center text-xl transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="w-9 h-9 rounded-md flex items-center justify-center text-xl transition-all shadow-sm bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
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
