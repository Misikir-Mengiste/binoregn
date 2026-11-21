"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { RichText } from "@/components/rich-text";
import { cn } from "@/lib/utils";

// Collapsed height ≈ 4–5 lines of body text.
const COLLAPSED_PX = 112;
const FADE_MASK = {
  maskImage: "linear-gradient(to bottom, #000 55%, transparent)",
  WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent)",
};

// Long descriptions are shortened with a soft fade; "See more" slides the
// rest open (animated max-height, measured from the real content so the
// animation ends exactly at the text's height). The toggle only appears
// when the content actually overflows, re-checked on resize since
// wrapping changes with viewport width. Respects prefers-reduced-motion.
export function ExpandableDescription({ html }: { html: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setFullHeight(el.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html]);

  const truncated = fullHeight > COLLAPSED_PX + 4;

  return (
    <div>
      <div
        className="relative overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none"
        style={{
          maxHeight: expanded ? fullHeight || undefined : COLLAPSED_PX,
          // Fade the text itself (not a white overlay), so it blends into
          // any background — including the translucent glass cards.
          ...(truncated && !expanded ? FADE_MASK : null),
        }}
      >
        <div ref={contentRef}>
          <RichText html={html} />
        </div>
      </div>
      {truncated ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-teal-700"
        >
          {expanded ? "See less" : "See more"}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
