"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { orderNumber } from "@/lib/order-number";
import { shortProductName } from "@/lib/short-name";

export type OrderRow = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerCity: string | null;
  buyerAddress: string;
  quantity: number;
  variant: string;
  deliveryStatus: string;
  fulfillmentStatus: string;
  paid: boolean;
  createdAt: string;
  productName: string;
  productImage: string | null;
  totalBirr: number;
  creatorName: string;
  commission: { status: string; amountBirr: number } | null;
};

export type OrderStat = {
  label: string;
  value: number;
  changePct: number | null;
  goodWhenUp: boolean;
  series: number[];
};

// One status per order for the list: closed states win, then delivered,
// otherwise the fulfilment step (Placed → Processing → Shipped).
type Stage = "PLACED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
export function orderStage(o: { deliveryStatus: string; fulfillmentStatus: string }): Stage {
  if (o.deliveryStatus === "CANCELLED" || o.deliveryStatus === "RETURNED") return o.deliveryStatus;
  if (o.deliveryStatus === "DELIVERED") return "DELIVERED";
  return (["PLACED", "PROCESSING", "SHIPPED"].includes(o.fulfillmentStatus)
    ? o.fulfillmentStatus
    : "PLACED") as Stage;
}

export const STAGE_BADGE: Record<Stage, { label: string; className: string; dot: string }> = {
  PLACED: { label: "Pending", className: "bg-peach-100 text-peach-700", dot: "bg-peach-700" },
  PROCESSING: { label: "Processing", className: "bg-blue-100 text-blue-700", dot: "bg-blue-700" },
  SHIPPED: { label: "Shipped", className: "bg-teal-100 text-teal-700", dot: "bg-teal-700" },
  DELIVERED: { label: "Delivered", className: "bg-mint-100 text-mint-500", dot: "bg-mint-500" },
  CANCELLED: { label: "Cancelled", className: "bg-coral-100 text-coral-500", dot: "bg-coral-500" },
  RETURNED: { label: "Returned", className: "bg-coral-100 text-coral-500", dot: "bg-coral-500" },
};

export function Pill({ className, dot, children }: { className: string; dot: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-pill border border-current/15 px-2.5 py-1 text-xs font-medium whitespace-nowrap", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {children}
    </span>
  );
}

const FILTERS: { value: "ALL" | Stage; label: string }[] = [
  { value: "ALL", label: "All orders" },
  { value: "PLACED", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "RETURNED", label: "Returned" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total-desc", label: "Total: high to low" },
  { value: "total-asc", label: "Total: low to high" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

const PAGE_SIZES = [10, 20, 50];
const STATS_KEY = "admin-orders-show-stats";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Addis_Ababa",
  });
}

function birr(amount: number) {
  return `${amount.toLocaleString("en-US")} ETB`;
}

// Small dropdown used by Filter / Sort / row actions.
function Menu({
  trigger,
  children,
  align = "left",
}: {
  trigger: (open: boolean, toggle: () => void) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative" onClick={(event) => event.stopPropagation()}>
      {trigger(open, () => setOpen((value) => !value))}
      {open ? (
        <div
          className={cn(
            "absolute z-30 mt-2 min-w-[190px] overflow-hidden rounded-[12px] border border-border bg-card py-1 shadow-hover",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

const menuItem =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-surface-100";

function Sparkline({ series, color }: { series: number[]; color: string }) {
  const max = Math.max(1, ...series);
  const w = 120;
  const h = 36;
  const points = series
    .map((v, i) => `${(i / (series.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28 shrink-0" aria-hidden preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const STAT_COLORS = ["var(--teal-600)", "var(--coral-500)", "var(--orange-500)", "var(--blue-700)"];

function StatCard({ stat, color }: { stat: OrderStat; color: string }) {
  const up = (stat.changePct ?? 0) >= 0;
  const good = stat.changePct === null || stat.changePct === 0 ? true : up === stat.goodWhenUp;
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-[16px] border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-ink-600">{stat.label}</p>
        <Sparkline series={stat.series} color={color} />
      </div>
      <p className="text-2xl leading-none font-semibold text-foreground sm:text-[28px]">
        {stat.value.toLocaleString("en-US")}
      </p>
      <div className="flex items-center gap-2 text-xs text-ink-400">
        {stat.changePct === null ? (
          <span className="rounded-pill border border-border px-2 py-0.5 text-ink-600">New</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-pill border px-2 py-0.5 font-medium",
              good ? "border-mint-500/30 text-mint-500" : "border-coral-500/30 text-coral-500",
            )}
          >
            {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(stat.changePct)}%
          </span>
        )}
        Vs last month
      </div>
    </div>
  );
}

function toCsv(rows: OrderRow[]) {
  const header = ["Order", "Date", "Customer", "Phone", "City", "Address", "Product", "Options", "Qty", "Total (ETB)", "Fulfillment", "Payment", "Creator"];
  const escape = (value: string | number) => {
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((o) => {
    const stage = orderStage(o);
    return [
      `#${orderNumber(o.id)}`,
      formatDate(o.createdAt),
      o.buyerName,
      o.buyerPhone,
      o.buyerCity ?? "",
      o.buyerAddress,
      o.productName,
      o.variant,
      o.quantity,
      o.totalBirr,
      STAGE_BADGE[stage].label,
      stage === "CANCELLED" || stage === "RETURNED" ? "" : o.paid ? "Received" : "Pending",
      o.creatorName,
    ].map(escape).join(",");
  });
  // BOM so Excel opens UTF-8 (Amharic names/addresses) correctly.
  return "﻿" + [header.join(","), ...lines].join("\r\n");
}

function downloadCsv(rows: OrderRow[], name: string) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function OrdersClient({
  orders: allOrders,
  stats,
  loadedAt,
}: {
  orders: OrderRow[];
  stats: OrderStat[];
  loadedAt: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | Stage>("ALL");
  const [sort, setSort] = useState<SortValue>("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [goTo, setGoTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Remember the statistics toggle per browser.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      if (stored !== null) {
        const frame = requestAnimationFrame(() => setShowStats(stored === "1"));
        return () => cancelAnimationFrame(frame);
      }
    } catch {
      // storage unavailable — keep default
    }
  }, []);
  function toggleStats() {
    setShowStats((value) => {
      try {
        localStorage.setItem(STATS_KEY, value ? "0" : "1");
      } catch {}
      return !value;
    });
  }

  // A refresh brings new server data — stop the spinner and drop
  // selections of orders that no longer exist.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setRefreshing(false);
      setSelected((prev) => new Set([...prev].filter((id) => allOrders.some((o) => o.id === id))));
    });
    return () => cancelAnimationFrame(frame);
  }, [allOrders]);

  const orders = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allOrders.filter((order) => {
      if (filter !== "ALL" && orderStage(order) !== filter) return false;
      if (!q) return true;
      return (
        order.buyerName.toLowerCase().includes(q) ||
        order.buyerPhone.includes(q) ||
        order.productName.toLowerCase().includes(q) ||
        order.creatorName.toLowerCase().includes(q) ||
        orderNumber(order.id).toLowerCase().includes(q.replace(/^#/, ""))
      );
    });
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sort === "total-desc") return b.totalBirr - a.totalBirr;
      if (sort === "total-asc") return a.totalBirr - b.totalBirr;
      return b.createdAt.localeCompare(a.createdAt);
    });
    return sorted;
  }, [allOrders, query, filter, sort]);

  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allOnPageSelected = pageItems.length > 0 && pageItems.every((o) => selected.has(o.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageItems.forEach((o) => next.delete(o.id));
      else pageItems.forEach((o) => next.add(o.id));
      return next;
    });
  }

  async function runBulk(label: string, ids: string[], request: (id: string) => Promise<Response>) {
    setBusy(label);
    setMessage(null);
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const response = await request(id);
          if (response.ok) return null;
          const body = await response.json().catch(() => null);
          return body?.error?.message ?? "failed";
        } catch {
          return "failed";
        }
      }),
    );
    const failures = results.filter(Boolean) as string[];
    setBusy(null);
    setMessage(
      failures.length === 0
        ? { ok: true, text: `${label}: ${ids.length} order${ids.length === 1 ? "" : "s"} updated.` }
        : { ok: false, text: `${label}: ${ids.length - failures.length} done, ${failures.length} skipped — ${failures[0]}` },
    );
    setRefreshing(true);
    router.refresh();
  }

  function bulkStatus(stage: "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED") {
    const ids = [...selected];
    runBulk(`Marked ${STAGE_BADGE[stage].label.toLowerCase()}`, ids, (id) =>
      stage === "CANCELLED"
        ? fetch(`/api/admin/orders/${id}/delivery`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED" }),
          })
        : fetch(`/api/admin/orders/${id}/fulfillment`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: stage }),
          }),
    );
  }

  function bulkDelete() {
    const ids = [...selected];
    if (!window.confirm(`Delete ${ids.length} order${ids.length === 1 ? "" : "s"}? They'll be hidden from all lists.`)) return;
    runBulk("Deleted", ids, (id) => fetch(`/api/admin/orders/${id}`, { method: "DELETE" })).then(() =>
      setSelected(new Set()),
    );
  }

  function deleteOne(order: OrderRow) {
    if (!window.confirm(`Delete order #${orderNumber(order.id)}? It'll be hidden from all lists.`)) return;
    runBulk("Deleted", [order.id], (id) => fetch(`/api/admin/orders/${id}`, { method: "DELETE" }));
  }

  // Page numbers: 1 … (current-1, current, current+1) … last.
  const pages = useMemo(() => {
    const set = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
    const list = [...set].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    list.forEach((p, i) => {
      if (i > 0 && p - list[i - 1] > 1) out.push("…");
      out.push(p);
    });
    return out;
  }, [pageCount, currentPage]);

  const selectedRows = allOrders.filter((o) => selected.has(o.id));
  const toolbarButton =
    "inline-flex h-10 items-center gap-2 rounded-[10px] border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-100";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold text-foreground sm:text-[26px]">Orders</h1>
        <button
          type="button"
          className={toolbarButton}
          onClick={() => downloadCsv(orders, `binoregn-orders-${new Date().toISOString().slice(0, 10)}.csv`)}
          disabled={orders.length === 0}
        >
          <Upload className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, phone, order #"
            className="h-10 w-full rounded-[10px] border border-border bg-card pr-3 pl-9 text-sm text-foreground outline-none placeholder:text-ink-400 focus:border-teal-600"
          />
        </div>
        <Menu
          trigger={(_, toggle) => (
            <button type="button" className={toolbarButton} onClick={toggle}>
              <Filter className="h-4 w-4" />
              {filter === "ALL" ? "Filter" : FILTERS.find((f) => f.value === filter)?.label}
              <ChevronDown className="h-4 w-4 text-ink-400" />
            </button>
          )}
        >
          {(close) =>
            FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={cn(menuItem, filter === f.value && "font-semibold text-teal-700")}
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                  close();
                }}
              >
                {f.label}
                <span className="ml-auto text-xs text-ink-400">
                  {f.value === "ALL" ? allOrders.length : allOrders.filter((o) => orderStage(o) === f.value).length}
                </span>
              </button>
            ))
          }
        </Menu>
        <Menu
          trigger={(_, toggle) => (
            <button type="button" className={toolbarButton} onClick={toggle}>
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </button>
          )}
        >
          {(close) =>
            SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                className={cn(menuItem, sort === s.value && "font-semibold text-teal-700")}
                onClick={() => {
                  setSort(s.value);
                  close();
                }}
              >
                {s.label}
              </button>
            ))
          }
        </Menu>
        <label className="ml-1 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground">
          Show Statistics
          <button
            type="button"
            role="switch"
            aria-checked={showStats}
            onClick={toggleStats}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              showStats ? "bg-teal-600" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                showStats && "translate-x-5",
              )}
            />
          </button>
        </label>
        <button
          type="button"
          className={cn(toolbarButton, "sm:ml-auto")}
          onClick={() => {
            setRefreshing(true);
            router.refresh();
          }}
          title="Refresh"
        >
          <CalendarDays className="h-4 w-4" />
          <span className="hidden sm:inline">Last update:</span>
          {new Date(loadedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Addis_Ababa" })}
          <RefreshCw className={cn("h-4 w-4 text-teal-600", refreshing && "animate-spin")} />
        </button>
      </div>

      {/* Statistics */}
      {showStats ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} color={STAT_COLORS[index]} />
          ))}
        </div>
      ) : null}

      {message ? (
        <p className={cn("text-sm", message.ok ? "text-teal-700" : "text-destructive")}>{message.text}</p>
      ) : null}

      {/* Table */}
      <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px] sm:text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-50 text-xs text-ink-600 [&>th]:px-3 [&>th]:py-3 [&>th]:font-medium [&>th:first-child]:pl-5 [&>th:last-child]:pr-5">
                <th className="w-11">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allOnPageSelected}
                    onChange={togglePage}
                    className="h-4 w-4 cursor-pointer rounded accent-teal-600"
                  />
                </th>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Items</th>
                <th>Total</th>
                <th>Fulfillment</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((order) => {
                const isSelected = selected.has(order.id);
                const stage = STAGE_BADGE[orderStage(order)];
                return (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className={cn(
                      "cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface-50 [&>td]:px-3 [&>td]:py-3 [&>td]:align-middle [&>td:first-child]:pl-5 [&>td:last-child]:pr-5",
                      isSelected && "bg-teal-100/40 shadow-[inset_3px_0_0_var(--teal-600)]",
                    )}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select order ${orderNumber(order.id)}`}
                        checked={isSelected}
                        onChange={() => toggleOne(order.id)}
                        className="h-4 w-4 cursor-pointer rounded accent-teal-600"
                      />
                    </td>
                    <td className="font-medium whitespace-nowrap text-foreground">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="hover:text-teal-700"
                      >
                        #{orderNumber(order.id)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-ink-600">{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                          {order.buyerName.trim()[0]?.toUpperCase() ?? "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[140px] truncate font-medium text-foreground">{order.buyerName}</p>
                          <p className="text-xs text-ink-400">{order.buyerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td title={order.productName}>
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-[8px] bg-surface-100">
                          {order.productImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={order.productImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="whitespace-nowrap text-foreground">{shortProductName(order.productName)}</p>
                          {order.variant ? <p className="text-xs text-ink-400">{order.variant}</p> : null}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap text-ink-600">
                      {order.quantity} {order.quantity === 1 ? "Item" : "Items"}
                    </td>
                    <td className="font-medium whitespace-nowrap text-foreground">{birr(order.totalBirr)}</td>
                    <td>
                      <Pill className={stage.className} dot={stage.dot}>{stage.label}</Pill>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex">
                        <Menu
                          align="right"
                          trigger={(_, toggle) => (
                            <button
                              type="button"
                              aria-label={`Actions for order ${orderNumber(order.id)}`}
                              onClick={toggle}
                              className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-card text-ink-600 hover:bg-surface-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          )}
                        >
                          {(close) => (
                            <>
                              <Link href={`/admin/orders/${order.id}`} className={menuItem} onClick={close}>
                                <Eye className="h-4 w-4 text-ink-400" /> View & edit
                              </Link>
                              <Link href={`/admin/orders/${order.id}/invoice`} className={menuItem} onClick={close}>
                                <FileText className="h-4 w-4 text-ink-400" /> Invoice
                              </Link>
                              <button
                                type="button"
                                className={cn(menuItem, "text-coral-500")}
                                onClick={() => {
                                  close();
                                  deleteOne(order);
                                }}
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </>
                          )}
                        </Menu>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-sm text-muted-foreground">
                    {allOrders.length === 0 ? "No orders yet." : "No orders match your search or filter."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-ink-600">
            <span className="text-xs">Showing per page</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="h-9 rounded-[10px] border border-border bg-card px-2 text-sm text-foreground outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <span className="text-xs text-ink-400">
              {orders.length === 0
                ? "0 orders"
                : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, orders.length)} of ${orders.length}`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="h-9 rounded-[10px] border border-border bg-card px-3 disabled:opacity-40"
            >
              Prev
            </button>
            {pages.map((p, i) =>
              p === "…" ? (
                <span key={`gap-${i}`} className="px-1.5 text-ink-400">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={cn(
                    "h-9 min-w-9 rounded-[10px] border px-2.5",
                    p === currentPage
                      ? "border-teal-600 bg-teal-600 font-semibold text-white"
                      : "border-border bg-card text-foreground hover:bg-surface-100",
                  )}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="h-9 rounded-[10px] border border-border bg-card px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <form
            className="flex items-center gap-2 text-ink-600"
            onSubmit={(event) => {
              event.preventDefault();
              const n = Number.parseInt(goTo, 10);
              if (!Number.isNaN(n)) setPage(Math.min(pageCount, Math.max(1, n)));
              setGoTo("");
            }}
          >
            <span className="text-xs">Go to page</span>
            <input
              value={goTo}
              onChange={(event) => setGoTo(event.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              aria-label="Page number"
              className="h-9 w-14 rounded-[10px] border border-border bg-card px-2 text-center text-sm text-foreground outline-none focus:border-teal-600"
            />
            <button type="submit" className="inline-flex items-center gap-0.5 text-sm font-medium text-foreground">
              Go <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 ? (
        <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-fit flex-wrap items-center justify-center gap-2 rounded-[14px] border border-border bg-card px-3 py-2.5 shadow-hover sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
          <span className="px-1 text-sm text-ink-600">
            <span className="font-semibold text-foreground">{selected.size}</span> Selected
          </span>
          <button
            type="button"
            className={toolbarButton}
            onClick={() => downloadCsv(selectedRows, `binoregn-orders-selected.csv`)}
          >
            <Upload className="h-4 w-4" /> Export
          </button>
          <Menu
            trigger={(_, toggle) => (
              <button type="button" className={toolbarButton} onClick={toggle} disabled={busy !== null}>
                Update status <ChevronDown className="h-4 w-4 text-ink-400" />
              </button>
            )}
          >
            {(close) =>
              (["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  className={menuItem}
                  onClick={() => {
                    close();
                    if (
                      stage === "DELIVERED" &&
                      !window.confirm(
                        `Mark ${selected.size} order${selected.size === 1 ? "" : "s"} delivered? This creates the creators' commissions and can't be undone.`,
                      )
                    )
                      return;
                    bulkStatus(stage);
                  }}
                >
                  Mark {STAGE_BADGE[stage].label.toLowerCase()}
                </button>
              ))
            }
          </Menu>
          <button
            type="button"
            className={cn(toolbarButton, "text-coral-500")}
            onClick={bulkDelete}
            disabled={busy !== null}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => setSelected(new Set())}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
