"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BadgeDollarSign, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";

export type HistoryItem = {
  id: string;
  kind: "COMMISSION" | "WITHDRAWAL";
  title: string;
  subtitle: string;
  status: string;
  at: Date;
  amountBirr: number;
  direction: "in" | "out" | "neutral";
};

const FILTERS = [
  { value: "ALL", label: "All activity" },
  { value: "COMMISSION", label: "Earnings" },
  { value: "WITHDRAWAL", label: "Withdrawals" },
] as const;

export function EarningsHistory({ items }: { items: HistoryItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== "ALL" && item.kind !== filter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  return (
    <section className="overflow-hidden rounded-[16px] border border-border bg-card shadow-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-bold text-foreground">Earnings history</h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              className="h-9 w-full rounded-[8px] border border-border bg-card pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-ink-400"
            />
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-9 rounded-[8px] border border-border bg-card px-2.5 text-sm text-ink-600 outline-none"
          >
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="flex flex-col divide-y divide-border">
          {filtered.map((item) => {
            const Icon =
              item.kind === "COMMISSION" ? BadgeDollarSign : ArrowUpRight;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-pill",
                      item.kind === "COMMISSION"
                        ? "bg-mint-100 text-mint-500"
                        : "bg-blue-100 text-blue-700",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {item.subtitle} · {new Date(item.at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={item.status} />
                  <span
                    className={cn(
                      "w-[92px] text-right text-[13.5px] font-semibold",
                      item.direction === "in" && "text-mint-500",
                      item.direction === "out" && "text-foreground",
                      item.direction === "neutral" && "text-ink-600",
                    )}
                  >
                    {item.direction === "in" && "+"}
                    {item.direction === "out" && "−"}
                    {item.amountBirr.toLocaleString()} ETB
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? "No earnings yet. Commissions appear here once a referred order is completed and its payment is confirmed."
            : "No activity matches your search."}
        </p>
      )}
    </section>
  );
}
