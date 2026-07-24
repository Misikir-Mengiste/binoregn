"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarSearchItem = {
  href: string;
  label: string;
  group?: string;
};

// Filters the static `items` (nav labels) by query, and — when
// `searchUrl` is given — also debounces a fetch to that endpoint for
// real content matches (products, orders, creators, etc.), merging both
// into one dropdown. Navigates on Enter/click, and the ⌘S/Ctrl+S
// shortcut shown in the UI focuses the box from anywhere on the page.
export function SidebarSearch({
  items,
  searchUrl,
}: {
  items: SidebarSearchItem[];
  searchUrl?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteItems, setRemoteItems] = useState<SidebarSearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();
  const hasRemote = Boolean(searchUrl) && trimmed.length >= 2;
  const navMatches = trimmed
    ? items.filter((item) =>
        item.label.toLowerCase().includes(trimmed.toLowerCase()),
      )
    : [];
  const matches = trimmed
    ? [...navMatches, ...(hasRemote ? remoteItems : [])]
    : [];
  // Derived rather than synced via its own effect — clamps automatically
  // whenever the match list shrinks (e.g. remote results arrive/clear).
  const safeActiveIndex = Math.min(activeIndex, Math.max(matches.length - 1, 0));

  // All setState calls here happen inside the timer/fetch callbacks
  // (deferred), never synchronously in the effect body itself.
  useEffect(() => {
    if (!hasRemote) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`${searchUrl}?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return;
          const body = await response.json();
          setRemoteItems(body.data?.items ?? []);
        })
        .catch((err) => {
          if ((err as Error).name !== "AbortError") setRemoteItems([]);
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hasRemote, trimmed, searchUrl]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function go(item: SidebarSearchItem) {
    router.push(item.href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(matches[safeActiveIndex] ?? matches[0]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(event.target.value.trim().length > 0);
        }}
        onFocus={() => setOpen(trimmed.length > 0)}
        onKeyDown={handleKeyDown}
        className="h-9 w-full rounded-[8px] border border-border bg-surface-100 pr-14 pl-9 text-xs text-ink-600 outline-none placeholder:text-ink-400"
        aria-label="Search"
      />
      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-ink-400">
        ⌘S
      </span>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-1.5 w-full overflow-hidden rounded-[8px] border border-border bg-card shadow-card">
          {matches.length === 0 ? (
            <p className="px-3 py-3 text-xs text-ink-400">
              {loading ? "Searching…" : "No matches."}
            </p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {matches.map((item, index) => (
                <li key={`${item.href}-${item.label}-${index}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => go(item)}
                    className={cn(
                      "flex w-full flex-col items-start px-3 py-2 text-left text-xs",
                      index === safeActiveIndex
                        ? "bg-surface-100 text-teal-700"
                        : "text-ink-600 hover:bg-surface-100",
                    )}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.group && (
                      <span className="text-[10px] text-ink-400">{item.group}</span>
                    )}
                  </button>
                </li>
              ))}
              {loading && (
                <li className="px-3 py-2 text-[10px] text-ink-400">Searching…</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
