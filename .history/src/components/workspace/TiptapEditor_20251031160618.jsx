import { useEffect, useImperativeHandle, forwardRef, useState } from "react";import { useEffect, useImperativeHandle, forwardRef, useState } from "react";import { useEffect, useImperativeHandle, forwardRef, useState } from "react";

import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";import { useEditor, EditorContent } from "@tiptap/react";import { useEditor, EditorContent } from "@tiptap/react";

import Link from "@tiptap/extension-link";

import Image from "@tiptap/extension-image";import StarterKit from "@tiptap/starter-kit";import StarterKit from "@tiptap/starter-kit";

import { Table } from "@tiptap/extension-table";

import { TableRow } from "@tiptap/extension-table-row";import Link from "@tiptap/extension-link";import Link from "@tiptap/extension-link";

import { TableCell } from "@tiptap/extension-table-cell";

import { TableHeader } from "@tiptap/extension-table-header";import Image from "@tiptap/extension-image";import Image from "@tiptap/extension-image";

import TaskList from "@tiptap/extension-task-list";

import TaskItem from "@tiptap/extension-task-item";import { Table } from "@tiptap/extension-table";import { Table } from "@tiptap/extension-table";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import { common, createLowlight } from "lowlight";import { TableRow } from "@tiptap/extension-table-row";import { TableRow } from "@tiptap/extension-table-row";

import { FootnoteReference, FootnoteDefinition } from "./FootnoteExtension";

import "./TiptapEditor.css";import { TableCell } from "@tiptap/extension-table-cell";import { TableCell } from "@tiptap/extension-table-cell";



const lowlight = createLowlight(common);import { TableHeader } from "@tiptap/extension-table-header";import { TableHeader } from "@tiptap/extension-table-header";



const TiptapEditor = forwardRef(import TaskList from "@tiptap/extension-task-list";import TaskList from "@tiptap/extension-task-list";

  (

    {import TaskItem from "@tiptap/extension-task-item";import TaskItem from "@tiptap/extension-task-item";

      content = "",

      onChange,import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

      onKeyDown,

      placeholder = "노트를 작성하세요...",import { common, createLowlight } from "lowlight";import { common, createLowlight } from "lowlight";

      disabled = false,

    },import { FootnoteReference, FootnoteDefinition } from "./FootnoteExtension";import { FootnoteReference, FootnoteDefinition } from "./FootnoteExtension";

    ref

  ) => {

    const [isCompact, setIsCompact] = useState(false);

const lowlight = createLowlight(common);// lowlight 인스턴스 생성

    const editor = useEditor({

      extensions: [const lowlight = createLowlight(common);

        StarterKit.configure({

          codeBlock: false,const TiptapEditor = forwardRef(

          heading: { levels: [1, 2, 3, 4, 5, 6] },

        }),  (const TiptapEditor = forwardRef(

        Link.configure({

          openOnClick: false,    {  (

          HTMLAttributes: { class: "text-blue-600 hover:underline" },

        }),      content = "",    {

        Image.configure({

          HTMLAttributes: { class: "max-w-full h-auto" },      onChange,      content = "",

        }),

        Table.configure({      onKeyDown,      onChange,

          resizable: true,

          HTMLAttributes: { class: "border-collapse table-auto w-full" },      placeholder = "노트를 작성하세요...",      onKeyDown,

        }),

        TableRow,      disabled = false,      placeholder = "노트를 작성하세요...",

        TableHeader.configure({

          HTMLAttributes: {    },      disabled = false,

            class: "border border-gray-300 bg-gray-50 px-4 py-2 font-semibold",

          },    ref    },

        }),

        TableCell.configure({  ) => {    ref

          HTMLAttributes: { class: "border border-gray-300 px-4 py-2" },

        }),    const [isCompact, setIsCompact] = useState(false);  ) => {

        TaskList.configure({

          HTMLAttributes: { class: "not-prose pl-2" },        const [isToolbarExpanded, setIsToolbarExpanded] = useState(true);

        }),

        TaskItem.configure({    const editor = useEditor({    

          nested: true,

          HTMLAttributes: { class: "flex items-start gap-2" },      extensions: [    const editor = useEditor({

        }),

        CodeBlockLowlight.configure({        StarterKit.configure({      extensions: [

          lowlight,

          HTMLAttributes: {          codeBlock: false,        StarterKit.configure({

            class:

              "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto",          heading: { levels: [1, 2, 3, 4, 5, 6] },          codeBlock: false, // CodeBlockLowlight 사용

          },

        }),        }),          heading: {

        FootnoteReference,

        FootnoteDefinition,        Link.configure({            levels: [1, 2, 3, 4, 5, 6],

      ],

      content: content || "<p>여기에 내용을 입력하세요...</p>",          openOnClick: false,          },

      editorProps: {

        attributes: {          HTMLAttributes: { class: "text-blue-600 hover:underline" },        }),

          class:

            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none",        }),        Link.configure({

        },

      },        Image.configure({          openOnClick: false,

      onUpdate: ({ editor }) => {

        onChange?.(editor.getHTML());          HTMLAttributes: { class: "max-w-full h-auto" },          HTMLAttributes: {

      },

    });        }),            class: "text-blue-600 hover:underline",



    useImperativeHandle(        Table.configure({          },

      ref,

      () => ({          resizable: true,        }),

        getEditor: () => editor,

        insertText: (text, position) => {          HTMLAttributes: { class: "border-collapse table-auto w-full" },        Image.configure({

          if (editor) {

            if (position !== undefined) {        }),          HTMLAttributes: {

              editor.chain().focus().insertContentAt(position, text).run();

            } else {        TableRow,            class: "max-w-full h-auto",

              editor.chain().focus().insertContent(text).run();

            }        TableHeader.configure({          },

          }

        },          HTMLAttributes: { class: "border border-gray-300 bg-gray-50 px-4 py-2 font-semibold" },        }),

        getSelection: () => {

          if (editor) {        }),        Table.configure({

            const { from, to } = editor.state.selection;

            return { index: from, length: to - from };        TableCell.configure({          resizable: true,

          }

          return null;          HTMLAttributes: { class: "border border-gray-300 px-4 py-2" },          HTMLAttributes: {

        },

        getText: (from = 0, to) => {        }),            class: "border-collapse table-auto w-full",

          if (editor) {

            const text = editor.state.doc.textContent;        TaskList.configure({          },

            return to !== undefined

              ? text.substring(from, to)          HTMLAttributes: { class: "not-prose pl-2" },        }),

              : text.substring(from);

          }        }),        TableRow,

          return "";

        },        TaskItem.configure({        TableHeader.configure({

        setSelection: (position) => {

          if (editor) {          nested: true,          HTMLAttributes: {

            editor.chain().focus().setTextSelection(position).run();

          }          HTMLAttributes: { class: "flex items-start gap-2" },            class: "border border-gray-300 bg-gray-50 px-4 py-2 font-semibold",

        },

        deleteText: (from, length) => {        }),          },

          if (editor) {

            editor.chain().focus().deleteRange({ from, to: from + length }).run();        CodeBlockLowlight.configure({        }),

          }

        },          lowlight,        TableCell.configure({

      }),

      [editor]          HTMLAttributes: { class: "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto" },          HTMLAttributes: {

    );

        }),            class: "border border-gray-300 px-4 py-2",

    useEffect(() => {

      if (editor && content !== editor.getHTML()) {        FootnoteReference,          },

        editor.commands.setContent(content, false);

      }        FootnoteDefinition,        }),

    }, [content, editor]);

      ],        TaskList.configure({

    if (!editor) {

      return (      content: content || "<p>여기에 내용을 입력하세요...</p>",          HTMLAttributes: {

        <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">

          <div className="p-8 text-center text-gray-500">에디터 로딩 중...</div>      editorProps: {            class: "not-prose pl-2",

        </div>

      );        attributes: { class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none" },          },

    }

      },        }),

    const btnSize = isCompact ? "w-7 h-7" : "w-8 h-8";

    const gap = isCompact ? "gap-0.5" : "gap-1";      onUpdate: ({ editor }) => {        TaskItem.configure({

    const padding = isCompact ? "p-1.5" : "p-2";

    const btnClass = (active) =>        onChange?.(editor.getHTML());          nested: true,

      `${btnSize} rounded flex items-center justify-center text-xs transition-all ${

        active      },          HTMLAttributes: {

          ? "bg-blue-500 text-white"

          : "bg-white hover:bg-gray-100 text-gray-700"    });            class: "flex items-start gap-2",

      }`;

          },

    return (

      <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">    useImperativeHandle(        }),

        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">

          <div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b border-gray-200">      ref,        CodeBlockLowlight.configure({

            <button

              onClick={() => setIsCompact(!isCompact)}      () => ({          lowlight,

              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"

              title={isCompact ? "툴바 확장" : "툴바 축소"}        getEditor: () => editor,          HTMLAttributes: {

            >

              {isCompact ? "▶ 확장" : "◀ 축소"}        insertText: (text, position) => {            class:

            </button>

            <span className="text-xs text-gray-400">번역 모드 대응</span>          if (editor) {              "bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto",

          </div>

            if (position !== undefined) {          },

          <div className={`flex flex-wrap items-center ${gap} ${padding}`}>

            {/* Text Formatting */}              editor.chain().focus().insertContentAt(position, text).run();        }),

            <button

              onClick={() => editor.chain().focus().toggleBold().run()}            } else {        FootnoteReference,

              className={`${btnClass(editor.isActive("bold"))} font-bold`}

              title="Bold (Ctrl+B)"              editor.chain().focus().insertContent(text).run();        FootnoteDefinition,

            >

              B            }      ],

            </button>

            <button          }      content: content || "<p>여기에 내용을 입력하세요...</p>",

              onClick={() => editor.chain().focus().toggleItalic().run()}

              className={`${btnClass(editor.isActive("italic"))} italic`}        },      editorProps: {

              title="Italic (Ctrl+I)"

            >        getSelection: () => {        attributes: {

              I

            </button>          if (editor) {          class:

            <button

              onClick={() => editor.chain().focus().toggleStrike().run()}            const { from, to } = editor.state.selection;            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[300px] max-w-none",

              className={`${btnClass(editor.isActive("strike"))} line-through`}

              title="Strikethrough"            return { index: from, length: to - from };        },

            >

              S          }      },

            </button>

            <button          return null;      onUpdate: ({ editor }) => {

              onClick={() => editor.chain().focus().toggleCode().run()}

              className={`${btnClass(editor.isActive("code"))} font-mono`}        },        const html = editor.getHTML();

              title="Inline Code"

            >        getText: (from = 0, to) => {        onChange?.(html);

              &lt;&gt;

            </button>          if (editor) {      },



            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}            const text = editor.state.doc.textContent;    });



            {/* Headings */}            return to !== undefined ? text.substring(from, to) : text.substring(from);

            {[1, 2, 3].map((level) => (

              <button          }    // ref를 통해 editor 인스턴스와 유용한 메서드들 노출

                key={level}

                onClick={() =>          return "";    useImperativeHandle(

                  editor.chain().focus().toggleHeading({ level }).run()

                }        },      ref,

                className={`${btnClass(

                  editor.isActive("heading", { level })        setSelection: (position) => {      () => ({

                )} font-semibold`}

                title={`Heading ${level}`}          if (editor) {        getEditor: () => editor,

              >

                H{level}            editor.chain().focus().setTextSelection(position).run();        insertText: (text, position) => {

              </button>

            ))}          }          if (editor) {



            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}        },            if (position !== undefined) {



            {/* Lists */}        deleteText: (from, length) => {              editor.chain().focus().insertContentAt(position, text).run();

            <button

              onClick={() => editor.chain().focus().toggleBulletList().run()}          if (editor) {            } else {

              className={btnClass(editor.isActive("bulletList"))}

              title="Bullet List"            editor.chain().focus().deleteRange({ from, to: from + length }).run();              editor.chain().focus().insertContent(text).run();

            >

              •          }            }

            </button>

            <button        },          }

              onClick={() => editor.chain().focus().toggleOrderedList().run()}

              className={btnClass(editor.isActive("orderedList"))}      }),        },

              title="Numbered List"

            >      [editor]        getSelection: () => {

              ①

            </button>    );          if (editor) {

            <button

              onClick={() => editor.chain().focus().toggleTaskList().run()}            const { from, to } = editor.state.selection;

              className={btnClass(editor.isActive("taskList"))}

              title="Task List"    useEffect(() => {            return { index: from, length: to - from };

            >

              ☑      if (editor && content !== editor.getHTML()) {          }

            </button>

        editor.commands.setContent(content, false);          return null;

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

      }        },

            {/* Blocks */}

            <button    }, [content, editor]);        getText: (from = 0, to) => {

              onClick={() => editor.chain().focus().toggleCodeBlock().run()}

              className={`${btnClass(editor.isActive("codeBlock"))} font-mono`}          if (editor) {

              title="Code Block"

            >    if (!editor) {            const text = editor.state.doc.textContent;

              &#123;&#125;

            </button>      return (            return to !== undefined

            <button

              onClick={() => editor.chain().focus().toggleBlockquote().run()}        <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">              ? text.substring(from, to)

              className={btnClass(editor.isActive("blockquote"))}

              title="Blockquote"          <div className="p-8 text-center text-gray-500">에디터 로딩 중...</div>              : text.substring(from);

            >

              💬        </div>          }

            </button>

      );          return "";

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

    }        },

            {/* Link & Image */}

            <button        setSelection: (position) => {

              onClick={() => {

                const url = prompt("링크 URL을 입력하세요:");    const btnSize = isCompact ? "w-7 h-7" : "w-8 h-8";          if (editor) {

                if (url) {

                  editor.chain().focus().setLink({ href: url }).run();    const gap = isCompact ? "gap-0.5" : "gap-1";            editor.chain().focus().setTextSelection(position).run();

                }

              }}    const padding = isCompact ? "p-1" : "p-2";          }

              className={btnClass(editor.isActive("link"))}

              title="Insert Link"    const btnClass = (active) => `${btnSize} rounded flex items-center justify-center text-xs transition-all ${active ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100 text-gray-700"}`;        },

            >

              🔗        deleteText: (from, length) => {

            </button>

    return (          if (editor) {

            {!isCompact && (

              <button      <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">            editor

                onClick={() => {

                  const url = prompt("이미지 URL을 입력하세요:");        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">              .chain()

                  if (url) {

                    editor.chain().focus().setImage({ src: url }).run();          <div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b border-gray-200">              .focus()

                  }

                }}            <button onClick={() => setIsCompact(!isCompact)} className="text-xs text-gray-600 hover:text-gray-900" title={isCompact ? "확장" : "축소"}>              .deleteRange({ from, to: from + length })

                className={btnClass(false)}

                title="Insert Image"              {isCompact ? "▶ 확장" : "◀ 축소"}              .run();

              >

                🖼            </button>          }

              </button>

            )}            <span className="text-xs text-gray-400">번역 모드용 컴팩트 툴바</span>        },



            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}          </div>      }),



            {/* Table */}      [editor]

            <button

              onClick={() =>          <div className={`flex flex-wrap items-center ${gap} ${padding}`}>    );

                editor

                  .chain()            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnClass(editor.isActive("bold"))} font-bold`} title="Bold">B</button>

                  .focus()

                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnClass(editor.isActive("italic"))} italic`} title="Italic">I</button>    // content prop이 변경될 때 에디터 업데이트 (외부 변경 반영)

                  .run()

              }            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnClass(editor.isActive("strike"))} line-through`} title="Strike">S</button>    useEffect(() => {

              className={btnClass(false)}

              title="Insert Table"            <button onClick={() => editor.chain().focus().toggleCode().run()} className={`${btnClass(editor.isActive("code"))} font-mono`} title="Code">&lt;&gt;</button>      if (editor && content !== editor.getHTML()) {

            >

              ⊞                    editor.commands.setContent(content, false);

            </button>

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}      }

            {editor.isActive("table") && (

              <>                }, [content, editor]);

                <button

                  onClick={() => editor.chain().focus().addColumnAfter().run()}            {[1, 2, 3].map(level => (

                  className="w-10 h-7 rounded text-xs bg-white hover:bg-gray-100 transition-colors"

                  title="Add Column"              <button key={level} onClick={() => editor.chain().focus().toggleHeading({ level }).run()} className={`${btnClass(editor.isActive("heading", { level }))} font-semibold`} title={`H${level}`}>H{level}</button>    if (!editor) {

                >

                  +col            ))}      return (

                </button>

                <button                    <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">

                  onClick={() => editor.chain().focus().addRowAfter().run()}

                  className="w-10 h-7 rounded text-xs bg-white hover:bg-gray-100 transition-colors"            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}          <div className="p-8 text-center text-gray-500">에디터 로딩 중...</div>

                  title="Add Row"

                >                    </div>

                  +row

                </button>            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Bullet">•</button>      );

                <button

                  onClick={() => editor.chain().focus().deleteTable().run()}            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Numbered">①</button>    }

                  className="w-7 h-7 rounded text-sm bg-red-50 hover:bg-red-100 text-red-600 transition-colors"

                  title="Delete Table"            <button onClick={() => editor.chain().focus().toggleTaskList().run()} className={btnClass(editor.isActive("taskList"))} title="Task">☑</button>

                >

                  ✕                return (

                </button>

              </>            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}      <div className="tiptap-editor border border-gray-300 rounded-lg overflow-hidden">

            )}

                    {/* 툴바 */}

            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}

            <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`${btnClass(editor.isActive("codeBlock"))} font-mono`} title="Code Block">&#123;&#125;</button>        <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">

            {/* Horizontal Rule */}

            {!isCompact && (            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))} title="Quote">💬</button>          {/* 툴바 토글 버튼 */}

              <button

                onClick={() => editor.chain().focus().setHorizontalRule().run()}                      <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">

                className={btnClass(false)}

                title="Horizontal Rule"            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}            <button

              >

                ─                          onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}

              </button>

            )}            <button onClick={() => { const url = prompt("URL:"); if (url) editor.chain().focus().setLink({ href: url }).run(); }} className={btnClass(editor.isActive("link"))} title="Link">🔗</button>              className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"



            {/* Footnote */}                          title={isToolbarExpanded ? "툴바 접기" : "툴바 펼치기"}

            <button

              onClick={() => {            {!isCompact && (            >

                const id = prompt("각주 ID를 입력하세요 (예: 1):", "1");

                if (id) {              <button onClick={() => { const url = prompt("Image URL:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }} className={btnClass(false)} title="Image">🖼</button>              <span className="text-base">{isToolbarExpanded ? "▼" : "▶"}</span>

                  editor.chain().focus().insertFootnoteReference(id).run();

                }            )}              {isToolbarExpanded ? "툴바 접기" : "툴바 펼치기"}

              }}

              className={`${btnClass(false)} font-mono`}                        </button>

              title="Insert Footnote (GFM)"

            >            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}            <span className="text-xs text-gray-400">

              [^]

            </button>                          {isToolbarExpanded ? "자주 사용하는 도구" : "클릭하여 모든 도구 보기"}



            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}            <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className={btnClass(false)} title="Table">⊞</button>            </span>



            {/* Undo/Redo */}                      </div>

            <button

              onClick={() => editor.chain().focus().undo().run()}            {editor.isActive("table") && (

              disabled={!editor.can().undo()}

              className={`${btnClass(false)} disabled:opacity-30 disabled:cursor-not-allowed`}              <>          {/* 툴바 내용 */}

              title="Undo (Ctrl+Z)"

            >                <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="w-10 h-7 rounded text-xs bg-white hover:bg-gray-100" title="+col">+col</button>          {isToolbarExpanded && (

              ↶

            </button>                <button onClick={() => editor.chain().focus().addRowAfter().run()} className="w-10 h-7 rounded text-xs bg-white hover:bg-gray-100" title="+row">+row</button>            <div className="flex flex-wrap gap-1.5 p-2.5">

            <button

              onClick={() => editor.chain().focus().redo().run()}                <button onClick={() => editor.chain().focus().deleteTable().run()} className="w-7 h-7 rounded text-sm bg-red-50 hover:bg-red-100 text-red-600" title="Delete">✕</button>              {/* 필수 도구 */}

              disabled={!editor.can().redo()}

              className={`${btnClass(false)} disabled:opacity-30 disabled:cursor-not-allowed`}              </>              <div className="flex flex-wrap gap-1 items-center">

              title="Redo (Ctrl+Y)"

            >            )}                {/* 텍스트 서식 */}

              ↷

            </button>                            <button

          </div>

        </div>            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}                  onClick={() => editor.chain().focus().toggleBold().run()}



        <div className="p-4 bg-white">            {!isCompact && <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)} title="HR">─</button>}                  className={`w-8 h-8 rounded flex items-center justify-center font-semibold text-xs transition-all ${

          <EditorContent editor={editor} />

        </div>                                editor.isActive("bold")

      </div>

    );            <button onClick={() => { const id = prompt("각주 ID:", "1"); if (id) editor.chain().focus().insertFootnoteReference(id).run(); }} className={`${btnClass(false)} font-mono`} title="Footnote">[^]</button>                      ? "bg-blue-500 text-white"

  }

);                                  : "bg-white hover:bg-gray-100 text-gray-700"



TiptapEditor.displayName = "TiptapEditor";            {!isCompact && <div className="w-px h-6 bg-gray-300 mx-1" />}                  }`}



export default TiptapEditor;                              title="Bold (Ctrl+B)"


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
