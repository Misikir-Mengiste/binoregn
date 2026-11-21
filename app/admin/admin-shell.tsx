"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminNotificationsBell } from "./notifications-bell";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminNotification } from "@/lib/admin-notifications";

export function AdminShell({
  children,
  email,
  notifications,
}: {
  children: React.ReactNode;
  email: string;
  notifications: AdminNotification[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen">
        <div className="hidden lg:flex">
          <AdminSidebar email={email} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5 lg:hidden">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-[8px]"
                onClick={() => setOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Logo className="h-5" />
            </div>
            <div className="hidden lg:block" />
            <AdminNotificationsBell notifications={notifications} />
          </header>
          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {/* Capped width so pages don't stretch edge to edge on wide screens. */}
            <div className="mx-auto w-full max-w-[1120px]">{children}</div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "visible" : "invisible",
        )}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-[260px] transform bg-card shadow-card transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Menu</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-[8px]"
              onClick={() => setOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AdminSidebar email={email} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </div>
  );
}
