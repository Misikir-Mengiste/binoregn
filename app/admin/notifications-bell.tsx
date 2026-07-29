"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ClipboardCheck,
  ShoppingBag,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminNotification } from "@/lib/admin-notifications";

const ICON: Record<AdminNotification["type"], LucideIcon> = {
  APPLICATION: ClipboardCheck,
  CREATOR: UserPlus,
  WITHDRAWAL: Wallet,
  ORDER: ShoppingBag,
};

const TILE: Record<AdminNotification["type"], string> = {
  APPLICATION: "bg-teal-100 text-teal-700",
  CREATOR: "bg-blue-100 text-blue-700",
  WITHDRAWAL: "bg-peach-100 text-peach-700",
  ORDER: "bg-mint-100 text-mint-500",
};

const SEEN_KEY = "admin-notifications-seen";

export function AdminNotificationsBell({
  notifications,
}: {
  notifications: AdminNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Same localStorage-only read-state approach as the creator bell
  // (see app/creator/notifications-bell.tsx) — no backend read state
  // exists, so "seen" just means "the bell has been opened since".
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(SEEN_KEY);
    } catch {
      return;
    }
    if (!stored) return;
    const frame = requestAnimationFrame(() => {
      try {
        setSeenIds(new Set(JSON.parse(stored) as string[]));
      } catch {
        // ignore malformed storage
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const unseenCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unseenCount > 0) {
      const ids = notifications.map((n) => n.id);
      setSeenIds(new Set(ids));
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
      } catch {
        // ignore storage errors
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-[8px] border border-border bg-card text-ink-600 transition-colors hover:bg-surface-100"
      >
        <Bell className="h-4 w-4" />
        {unseenCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-teal-600 px-1 text-[10px] font-semibold text-white">
            {unseenCount > 9 ? "9+" : unseenCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[320px] overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Needs your attention
            </p>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing pending. You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = ICON[notification.type];
                  return (
                    <li key={notification.id}>
                      <Link
                        href={notification.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-100"
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill",
                            TILE[notification.type],
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-medium text-foreground">
                            {notification.title}
                          </p>
                          <p className="truncate text-xs text-ink-600">
                            {notification.detail}
                          </p>
                          <p className="mt-0.5 text-[11px] text-ink-400">
                            {new Date(notification.at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
