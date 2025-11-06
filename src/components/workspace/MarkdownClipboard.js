import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// HTML을 마크다운으로 변환 (헤딩/리스트/링크 등 보존)
function htmlToMarkdown(html) {
  let markdown = html;

  // 코드 블록 먼저 처리
  markdown = markdown.replace(
    /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (m, code) => {
      // 코드 내부의 태그 제거 및 엔티티 디코딩 최소화
      const cleaned = code
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      return `\n\n\x60\x60\x60\n${cleaned}\n\x60\x60\x60\n\n`;
    }
  );

  // 헤딩
  markdown = markdown.replace(
    /<h1[^>]*>([\s\S]*?)<\/h1>/gi,
    (m, t) => `# ${t}\n\n`
  );
  markdown = markdown.replace(
    /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
    (m, t) => `## ${t}\n\n`
  );
  markdown = markdown.replace(
    /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
    (m, t) => `### ${t}\n\n`
  );
  markdown = markdown.replace(
    /<h4[^>]*>([\s\S]*?)<\/h4>/gi,
    (m, t) => `#### ${t}\n\n`
  );
  markdown = markdown.replace(
    /<h5[^>]*>([\s\S]*?)<\/h5>/gi,
    (m, t) => `##### ${t}\n\n`
  );
  markdown = markdown.replace(
    /<h6[^>]*>([\s\S]*?)<\/h6>/gi,
    (m, t) => `###### ${t}\n\n`
  );

  // 굵게/이탤릭/취소선/인라인코드
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*");
  markdown = markdown.replace(
    /<(s|del)[^>]*>([\s\S]*?)<\/(s|del)>/gi,
    "~~$2~~"
  );
  markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");

  // 링크/이미지
  markdown = markdown.replace(
    /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    (m, href, label) => `[${label}](${href})`
  );
  markdown = markdown.replace(
    /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi,
    (m, src, alt) => `![${alt}](${src})`
  );

  // 체크박스/리스트 항목
  markdown = markdown.replace(
    /<li[^>]*data-checked="true"[^>]*>([\s\S]*?)<\/li>/gi,
    (m, t) => `- [x] ${t}\n`
  );
  markdown = markdown.replace(
    /<li[^>]*data-checked="false"[^>]*>([\s\S]*?)<\/li>/gi,
    (m, t) => `- [ ] ${t}\n`
  );
  // 일반 ul -> "- " 리스트
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (m, c) => {
    return c.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (mm, t) => `- ${t}\n`);
  });
  // ol -> 번호 리스트
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (m, c) => {
    let i = 1;
    return c.replace(
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      (mm, t) => `${i++}. ${t}\n`
    );
  });

  // 인용구
  markdown = markdown.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (m, c) => {
      const inner = c
        .replace(/<br\s*\/?>(?=.)/gi, "\n")
        .replace(/<[^>]+>/g, "");
      return (
        inner
          .split(/\r?\n/)
          .map((line) => (line ? `> ${line}` : ">"))
          .join("\n") + "\n\n"
      );
    }
  );

  // 줄바꿈과 단락 처리
  markdown = markdown.replace(/<br\s*\/?>(?=.)/gi, "\n");
  markdown = markdown.replace(
    /<p[^>]*>([\s\S]*?)<\/p>/gi,
    (m, t) => `${t}\n\n`
  );

  // 남은 태그 제거 및 엔티티 처리
  markdown = markdown.replace(/<[^>]+>/g, "");
  markdown = markdown
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 빈 줄 정리
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  return markdown.trim();
}

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

  // 줄바꿈은 그대로 유지 (TipTap이 자동 처리)
  return html;
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
              const markdown = htmlToMarkdown(html);

              // 클립보드: text/plain 에 마크다운 저장 (HTML 미포함)
              event.clipboardData.setData("text/plain", markdown);
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
              const markdown = htmlToMarkdown(html);

              event.clipboardData.setData("text/plain", markdown);
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
            // 흔한 마크다운 패턴 감지 시 WYSIWYG(HTML)로 변환
            const mdPattern =
              /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```)|\*\*[^*\n]+\*\*|_[^_\n]+_|`[^`\n]+`|\[[^\]]+\]\([^)]+\)/;
            if (mdPattern.test(text)) {
              return markdownToHtml(text);
            }
            return text;
          },
        },
      }),
    ];
  },
});
