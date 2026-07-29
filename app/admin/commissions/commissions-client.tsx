"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { TableToolbar } from "@/components/table-toolbar";
import { Pagination } from "@/components/pagination";
import { InitialsAvatar } from "@/components/initials-avatar";
import { DeleteButton } from "@/components/delete-button";

type CommissionRow = {
  id: string;
  amountBirr: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  creator: {
    email: string;
    name: string | null;
    payoutMethod: string | null;
    payoutAccountName: string | null;
    payoutAccountNumber: string | null;
    payoutBankName: string | null;
  };
  order: { id: string; product: { name: string } };
};

const PAYOUT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE ETB",
};

function PayoutInfo({ creator }: { creator: CommissionRow["creator"] }) {
  if (!creator.payoutMethod || !creator.payoutAccountNumber) {
    return <span className="text-xs text-ink-400">Not set</span>;
  }
  const label = PAYOUT_METHOD_LABEL[creator.payoutMethod] ?? creator.payoutMethod;
  return (
    <div>
      <p className="font-semibold text-foreground">
        {creator.payoutMethod === "BANK_TRANSFER" && creator.payoutBankName
          ? `${label} (${creator.payoutBankName})`
          : label}
      </p>
      <p className="text-xs text-ink-400">
        {creator.payoutAccountNumber}
        {creator.payoutAccountName ? ` (${creator.payoutAccountName})` : ""}
      </p>
    </div>
  );
}

const PAGE_SIZE = 8;

export function CommissionsClient({
  commissions: allCommissions,
}: {
  commissions: CommissionRow[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const commissions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCommissions.filter((commission) => {
      if (status !== "ALL" && commission.status !== status) return false;
      if (!q) return true;
      return (
        commission.order.product.name.toLowerCase().includes(q) ||
        commission.creator.email.toLowerCase().includes(q) ||
        (commission.creator.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [allCommissions, query, status]);

  const pageCount = Math.max(1, Math.ceil(commissions.length / PAGE_SIZE));
  const pageItems = commissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function markPaid(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/commissions/${id}/pay`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error?.message ?? "Could not mark the commission paid",
        );
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteCommission(id: string) {
    const response = await fetch(`/api/admin/commissions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? "Could not delete the commission");
    }
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <TableToolbar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        searchPlaceholder="Search commissions…"
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        statusOptions={[
          { value: "ALL", label: "All Status" },
          { value: "PENDING", label: "Pending" },
          { value: "PAID", label: "Paid" },
        ]}
      />
      {error && (
        <p className="px-5 pt-3 text-sm text-destructive">{error}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead>
            <tr className="bg-surface-100 text-xs text-ink-400">
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Creator</th>
              <th className="px-5 py-3 font-medium">Payout method</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((commission) => (
              <tr key={commission.id} className="border-t border-border">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-foreground">
                    {commission.order.product.name}
                  </p>
                  <p className="text-xs text-ink-400">
                    Order #{commission.order.id.slice(0, 8)}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <InitialsAvatar
                      email={commission.creator.email}
                      size="sm"
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {commission.creator.name ?? commission.creator.email}
                      </p>
                      <p className="text-xs text-ink-400">
                        {commission.creator.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <PayoutInfo creator={commission.creator} />
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-foreground">
                    {commission.amountBirr.toLocaleString()} ETB
                  </p>
                  <p className="text-xs text-ink-400">
                    {new Date(commission.createdAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={commission.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {commission.status === "PENDING" ? (
                      <Button
                        size="sm"
                        className="h-8 rounded-[8px]"
                        disabled={pendingId === commission.id}
                        onClick={() => markPaid(commission.id)}
                      >
                        Mark paid
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {commission.paidAt
                          ? new Date(commission.paidAt).toLocaleDateString()
                          : "Paid"}
                      </span>
                    )}
                    <DeleteButton
                      label="Delete commission"
                      onDelete={() => deleteCommission(commission.id)}
                    />
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
                  {allCommissions.length === 0
                    ? "No commissions yet."
                    : "No commissions match your filters."}
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
