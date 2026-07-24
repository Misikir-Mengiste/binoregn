"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  HelpCircle,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
  {
    label: "My Shop",
    icon: Package,
    children: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/orders", label: "Orders" },
    ],
  },
  { href: "/admin/creators", label: "Creators", icon: Users },
  { href: "/admin/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  { href: "/admin/commissions", label: "Commissions", icon: Wallet },
];

export function AdminSidebar({
  email,
  onNavigate,
}: {
  email: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const displayName = email.split("@")[0] || "Admin";

  return (
    <nav className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <Logo className="h-8" />
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
            if ("children" in item && item.children) {
              const parentActive = item.children.some((child) =>
                pathname.startsWith(child.href),
              );
              const ParentIcon = item.icon;
              return (
                <li key={item.label}>
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600",
                      parentActive && "text-teal-600",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <ParentIcon
                        className={cn(
                          "h-4 w-4",
                          parentActive ? "text-teal-600" : "text-ink-400",
                        )}
                      />
                      {item.label}
                    </span>
                    <ChevronDown className="h-4 w-4 text-ink-400" />
                  </div>
                  <ul className="mt-1 flex flex-col gap-0.5 pl-7">
                    {item.children.map((child) => {
                      const active = pathname.startsWith(child.href);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center gap-2 rounded-[8px] px-3 py-2 text-[13px] font-medium text-ink-600 transition-colors hover:bg-surface-100",
                              active && "bg-surface-100 font-semibold text-teal-600",
                            )}
                          >
                            <span className="h-4 w-4" />
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

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
            <Link
              href="/admin/settings"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-surface-100",
                pathname.startsWith("/admin/settings") &&
                  "bg-surface-100 font-semibold text-teal-600",
              )}
            >
              <Settings
                className={cn(
                  "h-4 w-4",
                  pathname.startsWith("/admin/settings")
                    ? "text-teal-600"
                    : "text-ink-400",
                )}
              />
              Settings
            </Link>
          </li>
          <li>
            <span className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-400">
              <HelpCircle className="h-4 w-4 text-ink-400" />
              Help & Support
            </span>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                signOut({ callbackUrl: "/sign-in" });
              }}
              className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-surface-100"
            >
              <ChevronRight className="h-4 w-4 text-ink-400" />
              Sign out
            </button>
          </li>
        </ul>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-[8px] p-1">
          <InitialsAvatar email={email} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-[11px] text-ink-400">Super Admin</p>
          </div>
          <ChevronDown className="h-4 w-4 text-ink-400" />
        </div>
      </div>
    </nav>
  );
}
