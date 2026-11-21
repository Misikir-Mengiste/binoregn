"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Link2,
  Settings,
  Store,
  Wallet,
} from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Logo } from "@/components/logo";
import { SidebarSearch, type SidebarSearchItem } from "@/components/sidebar-search";
import { cn } from "@/lib/utils";

// Same shell as app/admin/admin-sidebar.tsx (sticky full-height,
// search box, Main Menu / Others grouping, avatar+chevron footer)
// — nav items scoped to what a creator can actually do
// (architecture.md: browse catalog, apply, view own approved
// links, view own earnings; no product/application management).
const MAIN_NAV = [
  { href: "/creator", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/creator/products", label: "Products", icon: Store },
  { href: "/creator/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/creator/links", label: "My Links", icon: Link2 },
  { href: "/creator/earnings", label: "Earnings", icon: Wallet },
];

const SEARCH_ITEMS: SidebarSearchItem[] = [
  ...MAIN_NAV.map((item) => ({ href: item.href, label: item.label })),
  { href: "/creator/settings", label: "Settings" },
];

export function CreatorSidebar({
  email,
  onNavigate,
}: {
  email: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const displayName = email.split("@")[0] || "Creator";

  return (
    <nav className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-surface-50">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <Logo className="h-6" />
      </div>

      <div className="px-4 pb-5">
        <SidebarSearch items={SEARCH_ITEMS} searchUrl="/api/creator/search" />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <p className="px-3 pb-2 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
          Main Menu
        </p>
        <ul className="flex flex-col gap-0.5">
          {MAIN_NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-white",
                    active && "bg-white font-semibold text-teal-600 shadow-[0_1px_2px_rgba(7,7,7,0.06)] ring-1 ring-border",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-teal-600" : "text-ink-400",
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 px-3 pb-2 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
          Others
        </p>
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href="/creator/settings"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-white",
                pathname.startsWith("/creator/settings") &&
                  "bg-surface-100 font-semibold text-teal-600",
              )}
            >
              <Settings
                className={cn(
                  "h-4 w-4",
                  pathname.startsWith("/creator/settings") ? "text-teal-600" : "text-ink-400",
                )}
              />
              Settings
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                signOut({ callbackUrl: "/sign-in" });
              }}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-white"
            >
              <ChevronRight className="h-4 w-4 text-ink-400" />
              Sign out
            </button>
          </li>
        </ul>
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="flex w-full items-center gap-3 rounded-[8px] p-1 text-left transition-colors hover:bg-white"
        >
          <InitialsAvatar email={email} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-[11px] text-ink-400">Creator</p>
          </div>
          <ChevronDown className="h-4 w-4 text-ink-400" />
        </button>
      </div>
    </nav>
  );
}
