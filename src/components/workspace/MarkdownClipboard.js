import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

// HTML을 마크다운으로 변환하는 함수
function htmlToMarkdown(html) {
  let markdown = html;

  // 헤딩 변환
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "##### $1\n\n");
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "###### $1\n\n");

  // 볼드, 이탤릭, 취소선
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~");
  markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~");

  // 코드
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  markdown = markdown.replace(
    /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis,
    "```\n$1\n```\n"
  );

  // 링크
  markdown = markdown.replace(
    /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
    "[$2]($1)"
  );

  // 이미지
  markdown = markdown.replace(
    /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
    "![$2]($1)"
  );

  // 리스트
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  });
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let index = 1;
    return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${index++}. $1\n`);
  });

  // 체크리스트
  markdown = markdown.replace(
    /<li[^>]*data-checked="true"[^>]*>(.*?)<\/li>/gi,
    "- [x] $1\n"
  );
  markdown = markdown.replace(
    /<li[^>]*data-checked="false"[^>]*>(.*?)<\/li>/gi,
    "- [ ] $1\n"
  );

  // 인용구
  markdown = markdown.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
    (match, content) => {
      return (
        content
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") + "\n"
      );
    }
  );

  // 수평선
  markdown = markdown.replace(/<hr[^>]*>/gi, "\n---\n");

  // 단락
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  markdown = markdown.replace(/<br[^>]*>/gi, "\n");

  // 남은 HTML 태그 제거
  markdown = markdown.replace(/<[^>]+>/g, "");

  // HTML 엔티티 디코드
  markdown = markdown.replace(/&nbsp;/g, " ");
  markdown = markdown.replace(/&lt;/g, "<");
  markdown = markdown.replace(/&gt;/g, ">");
  markdown = markdown.replace(/&amp;/g, "&");
  markdown = markdown.replace(/&quot;/g, '"');

  // 연속된 빈 줄 정리
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

  // 단락
  html = html.replace(/^(?!<[hul]|<li|<pre)(.+)$/gm, "<p>$1</p>");

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

              const html = this.editor.getHTML();
              const markdown = htmlToMarkdown(html);

              // 클립보드에 마크다운과 HTML 둘 다 복사
              event.clipboardData.setData("text/plain", markdown);
              event.clipboardData.setData("text/html", html);
              event.preventDefault();

              return true;
            },
            cut: (view, event) => {
              const { state } = view;
              const { from, to } = state.selection;

              if (from === to) return false;

              const html = this.editor.getHTML();
              const markdown = htmlToMarkdown(html);

              event.clipboardData.setData("text/plain", markdown);
              event.clipboardData.setData("text/html", html);
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
