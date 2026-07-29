import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT: Record<string, string> = {
  teal: "bg-teal-100 text-teal-700",
  orange: "bg-peach-100 text-peach-700",
  mint: "bg-mint-100 text-mint-500",
  coral: "bg-coral-100 text-coral-500",
};

export type KpiItem = {
  label: string;
  value: string | number;
  caption?: string;
  icon: LucideIcon;
  accent?: keyof typeof ACCENT;
};

/** Single horizontal strip with vertical dividers — matches SadaxCart KPI row. */
export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2",
          items.length >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3",
        )}
      >
        {items.map((item, index) => (
          <div
            key={item.label}
            className={cn(
              "flex flex-col gap-2 px-6 py-5",
              index > 0 && "border-t border-border sm:border-t-0",
              index % 2 === 1 && "sm:border-l",
              index >= 2 && "xl:border-l",
              index === 2 && "sm:border-l-0 xl:border-l",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-ink-600">{item.label}</p>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]",
                  ACCENT[item.accent ?? "teal"],
                )}
              >
                <item.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-[22px] font-bold tracking-tight text-foreground">
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.caption ?? `${item.label} last 365 days`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
