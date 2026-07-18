"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  ClipboardCheck,
  LayoutDashboard,
  Link2,
  Search,
  Settings,
  Store,
  Wallet,
} from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
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

export function CreatorSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const displayName = email.split("@")[0] || "Creator";

  return (
    <nav className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
          A
        </div>
        <span className="truncate text-[15px] font-bold text-foreground">
          Affiliate Market
        </span>
      </div>

      <div className="px-4 pb-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            placeholder="Search…"
            readOnly
            className="h-9 w-full rounded-[8px] border border-border bg-surface-100 pr-14 pl-9 text-xs text-ink-600 outline-none placeholder:text-ink-400"
            aria-label="Search"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-ink-400">
            ⌘S
          </span>
        </div>
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
                  className={cn(
                    "flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-surface-100",
                    active && "bg-surface-100 font-semibold text-teal-600",
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
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-surface-100"
            >
              <Settings className="h-4 w-4 text-ink-400" />
              Settings / Sign out
            </button>
          </li>
        </ul>
      </div>

      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="flex w-full items-center gap-3 rounded-[8px] p-1 text-left transition-colors hover:bg-surface-100"
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
