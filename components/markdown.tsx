import type { ReactNode } from "react";

// Minimal, dependency-free renderer for the small markdown subset the
// product-description toolbar produces: **bold**, *italic*, __underline__,
// [text](url) links, and "- " bullet lists. It builds a React tree (text
// is auto-escaped — no dangerouslySetInnerHTML), and link hrefs are scheme-
// checked, so untrusted description text can't inject scripts.

function safeHref(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

const INLINE =
  /(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/g;

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<u key={key++}>{match[4]}</u>);
    } else if (match[6] !== undefined) {
      nodes.push(<em key={key++}>{match[6]}</em>);
    } else if (match[8] !== undefined) {
      const href = safeHref(match[9]);
      nodes.push(
        href ? (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-teal-700 underline"
          >
            {match[8]}
          </a>
        ) : (
          match[8]
        ),
      );
    }
    lastIndex = INLINE.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    if (/^\s*-\s+/.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc space-y-1 pl-5">
          {items.map((item, j) => (
            <li key={j}>{parseInline(item)}</li>
          ))}
        </ul>,
      );
    } else if (lines[i].trim() === "") {
      i++;
    } else {
      blocks.push(<p key={key++}>{parseInline(lines[i])}</p>);
      i++;
    }
  }

  return <div className={className}>{blocks}</div>;
}
