"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleCard({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[16px] border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4"
      >
        <span className="text-[15px] font-bold text-foreground">{title}</span>
        <ChevronUp
          className={cn(
            "h-4 w-4 text-ink-400 transition-transform",
            !open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="px-5 pb-5">{children}</div> : null}
    </div>
  );
}
