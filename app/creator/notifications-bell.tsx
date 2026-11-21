"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeDollarSign,
  Bell,
  ClipboardCheck,
  Megaphone,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreatorNotification } from "@/lib/creator-notifications";
import { formatDate } from "@/lib/format";

const ICON: Record<CreatorNotification["type"], LucideIcon> = {
  APPLICATION: ClipboardCheck,
  COMMISSION: BadgeDollarSign,
  PROFILE: UserCheck,
  ANNOUNCEMENT: Megaphone,
};

// Saved notifications (lib/creator-notifications.ts). Opening the bell
// marks everything read on the server, so the badge stays cleared on
// every device.
export function NotificationsBell({
  notifications,
}: {
  notifications: CreatorNotification[];
}) {
  const [open, setOpen] = useState(false);
  // Ids marked read in this visit — only these, so anything arriving
  // later (the layout re-renders on navigation) still shows as new.
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

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

  const isUnread = (n: CreatorNotification) => n.unread && !readIds.has(n.id);
  const unreadCount = notifications.filter(isUnread).length;

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      setReadIds(new Set(notifications.map((n) => n.id)));
      fetch("/api/creator/notifications/read", { method: "POST" }).catch(() => {
        // Badge already cleared locally; it'll reappear on the next load
        // if the request failed, which is the honest outcome.
      });
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
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-teal-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => {
                  const Icon = ICON[notification.type];
                  const content = (
                    <>
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill",
                          notification.positive
                            ? "bg-mint-100 text-mint-500"
                            : "bg-coral-100 text-coral-500",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-ink-600">
                          {notification.detail}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          {formatDate(notification.at)}
                        </p>
                      </div>
                      {isUnread(notification) ? (
                        <span
                          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600"
                          aria-label="Unread"
                        />
                      ) : null}
                    </>
                  );
                  return (
                    <li key={notification.id}>
                      {notification.href ? (
                        <Link
                          href={notification.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-surface-100"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 px-4 py-3">
                          {content}
                        </div>
                      )}
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
