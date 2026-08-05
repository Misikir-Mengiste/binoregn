"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { RichText } from "@/components/rich-text";
import { cn } from "@/lib/utils";

// Long descriptions are clamped to a few lines; "See more" is only shown
// when the content actually overflows the clamp (short descriptions never
// get a toggle that does nothing). Re-checked on resize since wrapping
// changes with viewport width.
export function ExpandableDescription({ html }: { html: string }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkTruncation = () => {
      setTruncated(el.scrollHeight > el.clientHeight + 1);
    };

    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html]);

  return (
    <div>
      <div ref={contentRef} className={cn(!expanded && "line-clamp-4")}>
        <RichText html={html} />
      </div>
      {truncated || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 flex items-center gap-1 text-sm font-semibold text-teal-700"
        >
          {expanded ? "See less" : "See more"}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
