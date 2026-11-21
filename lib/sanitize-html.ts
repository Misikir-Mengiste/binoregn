// Whitelist sanitizer + cleaner for rich product-description HTML.
//
// Runs in three places (defense in depth, and so pasted junk never
// reaches the page): when the admin pastes into the editor
// (components/rich-text-editor.tsx), when a product is saved
// (lib/validations/product.ts), and when a description is rendered
// (components/rich-text.tsx).
//
// Safety: drops scripts/styles/iframes/comments, unknown tags (keeping
// their text), every attribute except a validated href and a limited
// style, and javascript: URLs.
//
// Cleaning (2026-11-11): text copied from other websites carried ~20 KB
// of inline styles, their text colours, and list-inside-list wrappers that
// showed as doubled bullets. Now only the editor's own palette colours and
// plain text-align values survive, a list item that only wraps another
// list is flattened, and empty elements / attribute-less spans are
// removed.

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "div",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
]);

const LIST_TAGS = new Set(["ul", "ol"]);

// Text colours the admin can pick in the editor — the only colours kept.
// Brand palette (context/design-system.md).
export const EDITOR_COLORS = [
  "#070707", // black
  "#4a524e", // grey
  "#0cb587", // brand green
  "#09996f", // dark green
  "#1c6fa8", // blue
  "#a2a50a", // olive
  "#b5200c", // red
] as const;

// "#0cb587" / "#0CB587" / "#0c8" / "rgb(12, 181, 135)" → "12,181,135".
function normalizeColor(value: string): string | null {
  const v = value.trim().toLowerCase();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(",");
  }
  const rgb = v.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(1|1\.0+)\s*)?\)$/);
  if (rgb) return `${rgb[1]},${rgb[2]},${rgb[3]}`;
  return null;
}

const ALLOWED_COLORS = new Set(EDITOR_COLORS.map((c) => normalizeColor(c)));
const ALLOWED_ALIGN = new Set(["left", "center", "right", "justify"]);

function safeHref(url: string): string | null {
  const value = url.trim();
  if (/^(https?:|mailto:)/i.test(value) || value.startsWith("/")) {
    return value.replace(/"/g, "%22");
  }
  return null;
}

// Only palette colours and plain text-align values.
function safeStyle(style: string): string {
  const out: string[] = [];
  for (const declaration of style.split(";")) {
    const idx = declaration.indexOf(":");
    if (idx === -1) continue;
    const key = declaration.slice(0, idx).trim().toLowerCase();
    const val = declaration.slice(idx + 1).trim().toLowerCase();
    if (key === "color") {
      const normalized = normalizeColor(val);
      if (normalized && ALLOWED_COLORS.has(normalized)) {
        out.push(`color: rgb(${normalized})`);
      }
    } else if (key === "text-align" && ALLOWED_ALIGN.has(val)) {
      out.push(`text-align: ${val}`);
    }
  }
  return out.join("; ");
}

// `bold`: the source styled this element bold (font-weight ≥ 600) — the
// style is dropped, but the emphasis is kept by wrapping its content in
// <strong>, so pasted feature titles stay bold.
type ElementNode = { tag: string; attrs: string; children: Node[]; bold?: boolean };
type Node = ElementNode | string;

const BOLD_TAGS = new Set(["strong", "b", "h2", "h3"]);
const BLOCK_TAGS = new Set(["div", "p", "ul", "ol", "li", "h2", "h3", "blockquote"]);

function isBoldStyle(rawAttrs: string) {
  const style = rawAttrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
  const weight = (style?.[2] ?? style?.[3] ?? "").match(/font-weight\s*:\s*([a-z0-9]+)/i)?.[1]?.toLowerCase();
  if (!weight) return false;
  return weight === "bold" || weight === "bolder" || Number(weight) >= 600;
}

function buildAttrs(tag: string, rawAttrs: string): string {
  let rebuilt = "";
  if (tag === "a") {
    const hrefMatch = rawAttrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const raw = hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "") : "";
    const href = safeHref(raw);
    if (href) rebuilt += ` href="${href}" target="_blank" rel="noreferrer noopener"`;
  }
  const styleMatch = rawAttrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
  if (styleMatch) {
    const style = safeStyle(styleMatch[2] ?? styleMatch[3] ?? "");
    if (style) rebuilt += ` style="${style}"`;
  }
  return rebuilt;
}

// Tolerant tree builder for the whitelisted subset: unknown tags are
// skipped (their text stays), stray closing tags are ignored, unclosed
// tags are closed at their parent's end.
function parse(html: string): Node[] {
  const root: ElementNode = { tag: "#root", attrs: "", children: [] };
  const stack: ElementNode[] = [root];
  const token = /<(\/?)([a-zA-Z0-9]+)([^>]*)>|([^<]+)|(<)/g;
  let match: RegExpExecArray | null;
  while ((match = token.exec(html))) {
    const [, closing, rawTag, rawAttrs, text, lone] = match;
    const parent = stack[stack.length - 1];
    if (text !== undefined || lone !== undefined) {
      parent.children.push(text ?? "&lt;");
      continue;
    }
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (closing) {
      const index = stack.map((n) => n.tag).lastIndexOf(tag);
      if (index > 0) stack.length = index;
      continue;
    }
    // Like browsers: a new <li>/<p> closes an unclosed sibling of the same tag.
    if ((tag === "li" || tag === "p") && parent.tag === tag) stack.pop();
    const element: ElementNode = {
      tag,
      attrs: buildAttrs(tag, rawAttrs),
      children: [],
      bold: !BOLD_TAGS.has(tag) && isBoldStyle(rawAttrs),
    };
    stack[stack.length - 1].children.push(element);
    if (tag !== "br" && !/\/\s*$/.test(rawAttrs)) stack.push(element);
  }
  return root.children;
}

const isBlank = (node: Node) => typeof node === "string" && !node.replace(/&nbsp;|\s/g, "");

function hasContent(node: Node): boolean {
  if (typeof node === "string") return !isBlank(node);
  if (node.tag === "br") return true;
  return node.children.some(hasContent);
}

function clean(nodes: Node[]): Node[] {
  const out: Node[] = [];
  for (const node of nodes) {
    if (typeof node === "string") {
      out.push(node);
      continue;
    }
    const children = clean(node.children);
    const element: ElementNode = { ...node, children };

    // Drop empty wrappers (keep <br>).
    if (element.tag !== "br" && !children.some(hasContent)) continue;

    // Keep pasted bold emphasis as <strong> (inside the element, so block
    // structure like <div>/<li> is preserved) — but only when the element
    // holds inline content. Sites often set font-weight on a whole section
    // wrapper; bolding that would bold entire paragraphs.
    const hasBlockChild = children.some(
      (child) => typeof child !== "string" && BLOCK_TAGS.has(child.tag),
    );
    if (element.bold && !hasBlockChild) {
      element.children = [{ tag: "strong", attrs: "", children }];
    }

    // Unwrap attribute-less spans.
    if (element.tag === "span" && !element.attrs) {
      out.push(...element.children);
      continue;
    }

    // Lists: a <li> that only wraps another list contributes that list's
    // items directly (fixes doubled bullets from pasted nested lists).
    if (LIST_TAGS.has(element.tag)) {
      const items: Node[] = [];
      for (const child of children) {
        if (typeof child !== "string" && child.tag === "li") {
          const meaningful = child.children.filter((c) => !isBlank(c));
          const only = meaningful[0];
          if (
            meaningful.length === 1 &&
            typeof only !== "string" &&
            LIST_TAGS.has(only.tag)
          ) {
            items.push(...only.children);
            continue;
          }
        }
        items.push(child);
      }
      element.children = items;
    }

    out.push(element);
  }
  return out;
}

function serialize(nodes: Node[]): string {
  return nodes
    .map((node) =>
      typeof node === "string"
        ? node
        : node.tag === "br"
          ? "<br>"
          : `<${node.tag}${node.attrs}>${serialize(node.children)}</${node.tag}>`,
    )
    .join("");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Drop dangerous elements (with their content) and HTML comments outright.
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|link|meta|title|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");

  return serialize(clean(parse(stripped))).trim();
}
