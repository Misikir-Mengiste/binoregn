"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 8);

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-border bg-card px-3 text-sm text-ink-600 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[8px] text-sm font-medium",
              p === page
                ? "bg-teal-600 text-white"
                : "text-ink-600 hover:bg-surface-100",
            )}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-9 items-center gap-1 rounded-[8px] border border-border bg-card px-3 text-sm text-ink-600 disabled:opacity-40"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
