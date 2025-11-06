import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// 마크다운을 HTML로 변환하는 간단한 함수
function markdownToHtml(markdown) {
  let html = markdown;

  // 헤딩
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // 코드 블록 (먼저 처리)
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // 볼드
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 이탤릭
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // 취소선
  html = html.replace(/~~(.+?)~~/g, "<s>$1</s>");

  // 인라인 코드
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");

  // 링크
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // 이미지
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1">');

  // 리스트
  html = html.replace(/^- \[x\] (.+)$/gm, '<li data-checked="true">$1</li>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<li data-checked="false">$1</li>');
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>");

  // 단락
  html = html.replace(/^(?!<[hul]|<li|<pre)(.+)$/gm, "<p>$1</p>");

  return html;
}

// HTML을 순수 텍스트로 변환 (개행 유지, 태그 제거)
function htmlToPlainText(html) {
  let text = html;

  // 줄바꿈 대응
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // 목록 항목은 접두사 추가 후 줄바꿈
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, c) => `- ${c}\n`);

  // 블록 요소의 경계에 줄바꿈 부여
  const blockTags = [
    "p",
    "div",
    "section",
    "article",
    "header",
    "footer",
    "main",
    "aside",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "table",
    "tr",
    "td",
  ];
  blockTags.forEach((tag) => {
    const openRe = new RegExp(`<${tag}[^>]*>`, "gi");
    const closeRe = new RegExp(`</${tag}>`, "gi");
    text = text.replace(openRe, "");
    // 닫는 태그 뒤에 줄바꿈
    text = text.replace(closeRe, "\n");
  });

  // 링크: 앵커 텍스트만 남기고 URL은 괄호로 보조 표시
  text = text.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (m, href, label) => {
      // 텍스트 중심. 필요 시 `${label} (${href})` 로 바꿀 수 있음
      return label;
    }
  );

  // 이미지: 대체 텍스트만 남김
  text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, (m, alt) =>
    alt ? `[${alt}]` : ""
  );

  // 잔여 모든 태그 제거
  text = text.replace(/<[^>]+>/g, "");

  // HTML 엔티티 디코딩
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 공백 정리: 줄 끝 공백 제거
  text = text.replace(/[ \t]+$/gm, "");
  // 3줄 이상 연속 개행을 2줄로 축약
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

export const MarkdownClipboard = Extension.create({
  name: "markdownClipboard",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownClipboard"),
        props: {
          // 복사 시: HTML을 마크다운으로 변환
          handleDOMEvents: {
            copy: (view, event) => {
              const { state } = view;
              const { from, to } = state.selection;

              if (from === to) return false;

              // 선택된 HTML만 추출
              const getSelectionHtml = () => {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return this.editor.getHTML();
                const container = document.createElement("div");
                for (let i = 0; i < sel.rangeCount; i++) {
                  const frag = sel.getRangeAt(i).cloneContents();
                  container.appendChild(frag);
                }
                return container.innerHTML || this.editor.getHTML();
              };

              const html = getSelectionHtml();
              const plain = htmlToPlainText(html);

              // 클립보드: text/plain 만 설정하여 어디에 붙여넣어도 태그가 보이지 않도록 강제
              event.clipboardData.setData("text/plain", plain);
              event.preventDefault();

              return true;
            },
            cut: (view, event) => {
              const { state } = view;
              const { from, to } = state.selection;

              if (from === to) return false;

              const getSelectionHtml = () => {
                const sel = window.getSelection();
                if (!sel || sel.rangeCount === 0) return this.editor.getHTML();
                const container = document.createElement("div");
                for (let i = 0; i < sel.rangeCount; i++) {
                  const frag = sel.getRangeAt(i).cloneContents();
                  container.appendChild(frag);
                }
                return container.innerHTML || this.editor.getHTML();
              };

              const html = getSelectionHtml();
              const plain = htmlToPlainText(html);

              event.clipboardData.setData("text/plain", plain);
              event.preventDefault();

              // 선택된 내용 삭제
              view.dispatch(state.tr.deleteSelection());

              return true;
            },
          },
          // 붙여넣기 시: 마크다운을 HTML로 변환
          transformPastedHTML(html) {
            return html;
          },
          transformPastedText(text) {
            // 마크다운 문법이 포함되어 있으면 HTML로 변환
            if (text.match(/[#*`[\]]/)) {
              return markdownToHtml(text);
            }
            return text;
          },
        },
      }),
    ];
  },
});
