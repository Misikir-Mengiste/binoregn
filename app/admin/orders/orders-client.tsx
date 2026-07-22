"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { TableToolbar } from "@/components/table-toolbar";
import { Pagination } from "@/components/pagination";
import { InitialsAvatar } from "@/components/initials-avatar";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string | null;
  buyerNotes: string | null;
  deliveryStatus: string;
  fulfillmentStatus: string;
  cashReconciledAt: Date | null;
  createdAt: Date;
  product: { name: string; priceBirr: number; imageUrls: string[] };
  creator: { email: string; name: string | null };
  commission: { status: string; amountBirr: number } | null;
};

const FULFILLMENT_STEPS = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const PAGE_SIZE = 8;

export function OrdersClient({ orders: allOrders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const orders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allOrders.filter((order) => {
      if (statusFilter !== "ALL" && order.deliveryStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.buyerName.toLowerCase().includes(q) ||
        order.product.name.toLowerCase().includes(q) ||
        order.creator.email.toLowerCase().includes(q) ||
        (order.creator.name ?? "").toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q)
      );
    });
  }, [allOrders, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const pageItems = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function markCashReconciled(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${id}/cash-reconciled`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not update the order");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  async function updateFulfillment(
    id: string,
    status: (typeof FULFILLMENT_STEPS)[number],
  ) {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${id}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not update the order");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <TableToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, Order ID…"
        status={statusFilter}
        onStatusChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        statusOptions={[
          { value: "ALL", label: "All Status" },
          { value: "PLACED", label: "Pending" },
          { value: "DELIVERED", label: "Completed" },
          { value: "CANCELLED", label: "Cancelled" },
          { value: "RETURNED", label: "Returned" },
        ]}
      />

      {error && (
        <p className="px-5 pt-3 text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-col gap-5 p-5">
        {pageItems.map((order) => {
          const locked = order.commission !== null;
          const busy = pendingId === order.id;
          const open = expandedId === order.id;
          const stepIndex = Math.max(
            0,
            FULFILLMENT_STEPS.indexOf(order.fulfillmentStatus as (typeof FULFILLMENT_STEPS)[number]),
          );
          return (
            <div
              key={order.id}
              className="rounded-[12px] border border-border bg-card shadow-card"
            >
              <div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-[10px] bg-surface-100">
                    {order.product.imageUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.product.imageUrls[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-teal-100" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {order.product.name}
                    </p>
                    <p className="text-sm text-ink-600">
                      {order.product.priceBirr.toLocaleString()} Birr
                    </p>
                    <p className="mt-2 text-xs text-ink-400">
                      Affiliate product
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 text-xs text-ink-600 sm:grid-cols-2 lg:grid-cols-2">
                  <div>
                    <p className="font-semibold text-foreground">Delivery address</p>
                    <p>{order.buyerName}</p>
                    <p>{order.buyerAddress}</p>
                    {order.buyerCity ? <p>{order.buyerCity}</p> : null}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Shipping updates</p>
                    <p>{order.creator.email}</p>
                    <p>{order.buyerPhone}</p>
                  </div>
                </div>
                {order.buyerNotes ? (
                  <div className="mt-3 rounded-[8px] border border-border bg-surface-100 px-3 py-2 text-xs text-ink-600">
                    <span className="font-semibold text-foreground">Notes: </span>
                    {order.buyerNotes}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-border px-5 py-4">
                <div className="mb-3 flex items-center justify-between text-xs text-ink-600">
                  <p>
                    Preparing to ship on{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.deliveryStatus} />
                    {order.commission && (
                      <StatusBadge status={order.commission.status} />
                    )}
                  </div>
                </div>
                <div className="h-2 w-full rounded-pill bg-surface-100">
                  <div
                    className="h-full rounded-pill bg-teal-600"
                    style={{ width: `${((stepIndex + 1) / FULFILLMENT_STEPS.length) * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                  {FULFILLMENT_STEPS.map((step) => (
                    <span
                      key={step}
                      className={step === order.fulfillmentStatus ? "text-teal-600" : ""}
                    >
                      {step === "PLACED"
                        ? "Order placed"
                        : step === "PROCESSING"
                          ? "Processing"
                          : step === "SHIPPED"
                            ? "Shipped"
                            : "Delivered"}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border px-5 py-4">
                <p className="text-xs text-ink-400">
                  Order #{order.id.slice(0, 10)}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/orders/${order.id}/invoice`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 rounded-[8px] bg-card",
                    )}
                  >
                    Invoice
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-[8px] bg-card"
                    onClick={() => setExpandedId(open ? null : order.id)}
                  >
                    {open ? "Hide" : "Edit steps"}
                  </Button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-card text-ink-400"
                    onClick={() => setExpandedId(open ? null : order.id)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-border bg-surface-100 px-5 py-4">
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-ink-600">
                      Creator: {order.creator.name ?? order.creator.email} · Cash:{" "}
                      {order.cashReconciledAt ? "Reconciled" : "Not reconciled"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {FULFILLMENT_STEPS.map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={
                            order.fulfillmentStatus === status ? "secondary" : "outline"
                          }
                          className="rounded-[8px] bg-card"
                          disabled={busy}
                          onClick={() => updateFulfillment(order.id, status)}
                        >
                          Mark{" "}
                          {status === "PLACED"
                            ? "placed"
                            : status === "PROCESSING"
                              ? "processing"
                              : status === "SHIPPED"
                                ? "shipped"
                                : "delivered"}
                        </Button>
                      ))}
                      {!order.cashReconciledAt && (
                        <Button
                          size="sm"
                          className="rounded-[8px]"
                          disabled={busy || locked}
                          onClick={() => markCashReconciled(order.id)}
                        >
                          Mark cash reconciled
                        </Button>
                      )}
                      {locked && (
                        <p className="text-xs text-muted-foreground">
                          Locked — a commission already exists for this order.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {pageItems.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {allOrders.length === 0
              ? "No orders yet."
              : "No orders match your filters."}
          </p>
        )}
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
