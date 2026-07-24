// Conservative whitelist sanitizer for the rich product-description HTML.
// The editor (components/rich-text-editor.tsx) only ever emits this small
// set of tags via document.execCommand, but descriptions are shown on the
// public storefront, so we still strip anything outside the whitelist
// (scripts, event handlers, javascript: URLs, unknown tags/attributes)
// before rendering — defense in depth even though only the admin authors it.

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

function safeHref(url: string): string | null {
  const value = url.trim();
  if (/^(https?:|mailto:)/i.test(value) || value.startsWith("/")) {
    return value.replace(/"/g, "%22");
  }
  return null;
}

// Only `color` and `text-align`, and only with simple/safe values.
function safeStyle(style: string): string {
  const out: string[] = [];
  for (const declaration of style.split(";")) {
    const idx = declaration.indexOf(":");
    if (idx === -1) continue;
    const key = declaration.slice(0, idx).trim().toLowerCase();
    const val = declaration.slice(idx + 1).trim();
    if (!val) continue;
    if (
      (key === "color" || key === "text-align") &&
      /^[#a-z0-9(),.\s%-]+$/i.test(val)
    ) {
      out.push(`${key}: ${val}`);
    }
  }
  return out.join("; ");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Drop dangerous elements (with their content) and HTML comments outright.
  let result = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<(script|style|iframe|object|embed|link|meta)[\s\S]*?<\/\1>/gi,
      "",
    )
    .replace(/<(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "");

  // Rebuild every remaining tag: drop non-whitelisted tags (keeping their
  // text), and for allowed tags keep only href (validated) and a limited
  // style attribute — every other attribute (incl. on* handlers) is removed.
  result = result.replace(
    /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g,
    (_match, closing: string, tag: string, attrs: string) => {
      const name = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";
      if (closing) return `</${name}>`;

      let rebuilt = "";
      if (name === "a") {
        const hrefMatch = attrs.match(
          /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i,
        );
        const raw = hrefMatch
          ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "")
          : "";
        const href = safeHref(raw);
        if (href) {
          rebuilt += ` href="${href}" target="_blank" rel="noreferrer noopener"`;
        }
      }
      const styleMatch = attrs.match(/style\s*=\s*("([^"]*)"|'([^']*)')/i);
      if (styleMatch) {
        const style = safeStyle(styleMatch[2] ?? styleMatch[3] ?? "");
        if (style) rebuilt += ` style="${style}"`;
      }
      return `<${name}${rebuilt}>`;
    },
  );

  return result;
}
