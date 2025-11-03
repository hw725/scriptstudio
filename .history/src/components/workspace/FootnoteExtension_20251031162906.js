import { Node, mergeAttributes } from "@tiptap/core";

// GFM 각주 참조 [^1]
export const FootnoteReference = Node.create({
  name: "footnoteReference",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-footnote-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-footnote-id": attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "sup[data-footnote-ref]",
      },
      {
        // GFM 마크다운 파싱: [^1]
        tag: "span",
        getAttrs: (node) => {
          const text = node.textContent;
          const match = text?.match(/^\[\^(.+?)\]$/);
          if (match) {
            return { id: match[1] };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const id = node.attrs.id;
    return [
      "sup",
      mergeAttributes(HTMLAttributes, {
        id: `fnref-${id}`,
        "data-footnote-id": id,
        class: "footnote-ref",
      }),
      [
        "a",
        {
          href: `#fn-${id}`,
          class: "footnote-link",
          "data-footnote-ref": "",
          "aria-describedby": "footnote-label",
        },
        `${id}`,
      ],
    ];
  },

  addCommands() {
    return {
      insertFootnoteReference:
        (id) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { id },
          });
        },
    };
  },

  // 마크다운 직렬화
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write(`[^${node.attrs.id}]`);
        },
      },
    };
  },
});

// GFM 각주 정의 [^1]: 내용
export const FootnoteDefinition = Node.create({
  name: "footnoteDefinition",
  group: "block",
  content: "inline*",

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-footnote-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-footnote-id": attributes.id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-footnote-def]",
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const id = node.attrs.id;
    return [
      "li",
      mergeAttributes(HTMLAttributes, {
        id: `fn-${id}`,
        "data-footnote-id": id,
      }),
      ["p", 0],
      [
        "a",
        {
          href: `#fnref-${id}`,
          class: "footnote-backref",
          "data-footnote-backref": "",
          "aria-label": "Back to content",
        },
        "↩",
      ],
    ];
  },

  addCommands() {
    return {
      insertFootnoteDefinition:
        (id, content = "") =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { id },
            content: content ? [{ type: "text", text: content }] : [],
          });
        },
    };
  },

  // 마크다운 직렬화
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write(`[^${node.attrs.id}]: `);
          state.renderInline(node);
          state.closeBlock(node);
        },
      },
    };
  },
});

// Footnotes container: <section class="footnotes" data-footnotes><ol>…</ol></section>
export const FootnotesSection = Node.create({
  name: "footnotesSection",
  group: "block",
  content: "footnoteDefinition+",

  parseHTML() {
    return [
      {
        tag: "section.footnotes",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(HTMLAttributes, { class: "footnotes", "data-footnotes": "" }),
      ["ol", 0],
    ];
  },
});

// GFM 각주 헬퍼 함수
export const footnoteHelpers = {
  // 텍스트에서 각주 파싱
  parseFootnotes(text) {
    const references = [];
    const definitions = [];

    // 참조 파싱: [^id]
    const refRegex = /\[\^(.+?)\]/g;
    let match;
    while ((match = refRegex.exec(text)) !== null) {
      references.push({
        id: match[1],
        position: match.index,
      });
    }

    // 정의 파싱: [^id]: content
    const defRegex = /^\[\^(.+?)\]:\s*(.+)$/gm;
    while ((match = defRegex.exec(text)) !== null) {
      definitions.push({
        id: match[1],
        content: match[2],
        position: match.index,
      });
    }

    return { references, definitions };
  },

  // 다음 각주 ID 생성
  getNextFootnoteId(editor) {
    const { doc } = editor.state;
    const ids = [];

    doc.descendants((node) => {
      if (node.type.name === "footnoteReference") {
        const id = node.attrs.id;
        if (id && /^\d+$/.test(id)) {
          ids.push(parseInt(id));
        }
      }
    });

    if (ids.length === 0) return "1";
    return String(Math.max(...ids) + 1);
  },

  // 각주 추가 (참조 + 정의)
  addFootnote(editor) {
    const id = this.getNextFootnoteId(editor);
    // 현재 위치에 참조 삽입
    editor.chain().focus().insertFootnoteReference(id).run();

    // footnotesSection 존재 여부 확인
    let sectionPos = null;
    let sectionNode = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type && node.type.name === "footnotesSection") {
        sectionPos = pos;
        sectionNode = node;
        return false; // stop traversal
      }
      return true;
    });

    if (sectionPos == null) {
      // 섹션이 없으면 새로 생성하여 정의 포함해 추가
      editor.chain().focus().insertContent({
        type: "footnotesSection",
        content: [
          {
            type: "footnoteDefinition",
            attrs: { id },
            content: [{ type: "text", text: "각주 내용을 입력하세요." }],
          },
        ],
      }).run();
    } else {
      // 섹션 끝에 정의 추가
      const insertPos = sectionPos + sectionNode.nodeSize - 1; // end of section content
      editor.chain().focus().insertContentAt(insertPos, {
        type: "footnoteDefinition",
        attrs: { id },
        content: [{ type: "text", text: "각주 내용을 입력하세요." }],
      }).run();
    }

    return id;
  },

  // 마크다운으로 변환
  toMarkdown(editor) {
    const { doc } = editor.state;
    let markdown = "";
    const footnotes = [];

    doc.descendants((node, pos) => {
      if (node.type.name === "footnoteReference") {
        markdown += `[^${node.attrs.id}]`;
      } else if (node.type.name === "footnoteDefinition") {
        const content = node.textContent;
        footnotes.push(`[^${node.attrs.id}]: ${content}`);
      } else if (node.isText) {
        markdown += node.text;
      }
    });

    // 각주 정의는 문서 끝에
    if (footnotes.length > 0) {
      markdown += "\n\n" + footnotes.join("\n");
    }

    return markdown;
  },

  // 마크다운에서 HTML로 변환
  fromMarkdown(markdown, editor) {
    const { references, definitions } = this.parseFootnotes(markdown);

    // 참조를 HTML로 변환
    let html = markdown;
    references.forEach((ref) => {
      html = html.replace(
        `[^${ref.id}]`,
        `<sup data-footnote-ref data-footnote-id="${ref.id}"><a href="#fn-${ref.id}" id="fnref-${ref.id}" class="footnote-link">${ref.id}</a></sup>`
      );
    });

    // 정의를 HTML로 변환
    definitions.forEach((def) => {
      const defHtml = `<div data-footnote-def data-footnote-id="${def.id}" class="footnote-definition" id="fn-${def.id}">
        <span class="footnote-label">${def.id}.</span> 
        <span class="footnote-content">${def.content}</span> 
        <a href="#fnref-${def.id}" class="footnote-backref">↩</a>
      </div>`;
      html = html.replace(`[^${def.id}]: ${def.content}`, defHtml);
    });

    return html;
  },
};
