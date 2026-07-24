import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize-html";

// Shared styling for the editor surface and the rendered output, so both
// look identical. Tailwind's preflight resets h2/ul/etc., so restore them
// with child-selector utilities.
export const richTextClass = cn(
  "text-sm leading-relaxed text-ink-600",
  "[&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground",
  "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_p]:my-1",
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-0.5",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-teal-500 [&_blockquote]:pl-3 [&_blockquote]:italic",
  "[&_a]:text-teal-700 [&_a]:underline",
  "[&_strong]:font-semibold [&_b]:font-semibold",
);

export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn(richTextClass, className)}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
