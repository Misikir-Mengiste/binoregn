"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { TableToolbar } from "@/components/table-toolbar";
import { Pagination } from "@/components/pagination";
import { InitialsAvatar } from "@/components/initials-avatar";

type OrderRow = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  deliveryStatus: string;
  cashReconciledAt: Date | null;
  createdAt: Date;
  product: { name: string; priceBirr: number; imageUrls: string[] };
  creator: { email: string; name: string | null };
  commission: { status: string; amountBirr: number } | null;
};

const DELIVERY_ACTIONS = ["DELIVERED", "CANCELLED", "RETURNED"] as const;
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

  async function updateDelivery(
    id: string,
    status: (typeof DELIVERY_ACTIONS)[number],
  ) {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${id}/delivery`, {
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="bg-surface-100 text-xs text-ink-400">
              <th className="px-5 py-3 font-medium">Product Name</th>
              <th className="px-5 py-3 font-medium">Customer Name</th>
              <th className="px-5 py-3 font-medium">Order Id</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((order) => {
              const locked = order.commission !== null;
              const busy = pendingId === order.id;
              const open = expandedId === order.id;
              return (
                <Fragment key={order.id}>
                  <tr className="border-t border-border">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {order.product.imageUrls[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={order.product.imageUrls[0]}
                            alt=""
                            className="h-10 w-10 rounded-[8px] object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-[8px] bg-teal-100" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            {order.product.name}
                          </p>
                          <p className="text-xs text-ink-400">
                            Affiliate product
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar email={order.buyerName} size="sm" />
                        <div>
                          <p className="font-semibold text-foreground">
                            {order.buyerName}
                          </p>
                          <p className="text-xs text-ink-400">
                            {order.buyerPhone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">
                        #{order.id.slice(0, 10)}
                      </p>
                      <p className="text-xs text-ink-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">
                        {order.product.priceBirr.toLocaleString()} Birr
                      </p>
                      <p className="text-xs text-ink-400">Cash on Delivery</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={order.deliveryStatus} />
                        {order.commission && (
                          <StatusBadge status={order.commission.status} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-[8px] bg-card"
                          onClick={() =>
                            setExpandedId(open ? null : order.id)
                          }
                        >
                          Details
                        </Button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-card text-ink-400"
                          onClick={() =>
                            setExpandedId(open ? null : order.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {open && (
                    <tr className="bg-surface-100">
                      <td colSpan={6} className="px-5 py-4">
                        <div className="flex flex-col gap-3">
                          <p className="text-xs text-ink-600">
                            Address: {order.buyerAddress} · Creator:{" "}
                            {order.creator.name ?? order.creator.email} · Cash:{" "}
                            {order.cashReconciledAt
                              ? "Reconciled"
                              : "Not reconciled"}
                          </p>
                          {!locked ? (
                            <div className="flex flex-wrap gap-2">
                              {DELIVERY_ACTIONS.map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={
                                    order.deliveryStatus === status
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="rounded-[8px] bg-card"
                                  disabled={busy}
                                  onClick={() =>
                                    updateDelivery(order.id, status)
                                  }
                                >
                                  Mark{" "}
                                  {status.charAt(0) +
                                    status.slice(1).toLowerCase()}
                                </Button>
                              ))}
                              {!order.cashReconciledAt && (
                                <Button
                                  size="sm"
                                  className="rounded-[8px]"
                                  disabled={busy}
                                  onClick={() => markCashReconciled(order.id)}
                                >
                                  Mark cash reconciled
                                </Button>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Locked — a commission already exists for this
                              order.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  {allOrders.length === 0
                    ? "No orders yet."
                    : "No orders match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
