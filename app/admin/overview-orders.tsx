"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { TableToolbar } from "@/components/table-toolbar";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";
import { shortProductName } from "@/lib/short-name";
import { formatDate } from "@/lib/format";

type OrderRow = {
  id: string;
  buyerName: string;
  deliveryStatus: string;
  createdAt: Date;
  product: { name: string; priceBirr: number; imageUrls: string[] };
};

const PAGE_SIZE = 6;

export function OverviewOrders({ orders }: { orders: OrderRow[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "ALL" && order.deliveryStatus !== status) return false;
      if (!q) return true;
      return (
        order.buyerName.toLowerCase().includes(q) ||
        order.product.name.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q)
      );
    });
  }, [orders, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-[15px] font-bold text-foreground">Recent Orders</h2>
      </div>
      <TableToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, Order ID…"
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
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
            {pageItems.map((order) => (
              <tr key={order.id} className="border-t border-border">
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
                        <span title={order.product.name}>{shortProductName(order.product.name)}</span>
                      </p>
                      <p className="text-xs text-ink-400">Affiliate product</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <InitialsAvatar email={order.buyerName} size="sm" />
                    <p className="font-semibold text-foreground">
                      {order.buyerName}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-foreground">
                    #{order.id.slice(0, 10)}
                  </p>
                  <p className="text-xs text-ink-400">
                    {formatDate(order.createdAt)}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-foreground">
                    {order.product.priceBirr.toLocaleString("en-US")} ETB
                  </p>
                  <p className="text-xs text-ink-400">Cash on Delivery</p>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={order.deliveryStatus} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-[8px] bg-card"
                    >
                      Details
                    </Button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border bg-card text-ink-400"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-muted-foreground"
                >
                  No orders yet.
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
