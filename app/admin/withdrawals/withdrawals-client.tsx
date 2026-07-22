"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { StatusBadge } from "@/components/status-badge";

type WithdrawalRow = {
  id: string;
  amountBirr: number;
  status: string;
  createdAt: Date;
  payoutMethod: string;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
  payoutBankName: string | null;
  creator: { email: string; name: string | null; creatorUsername: string | null };
};

const PAYOUT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
};

// Admin needs the actual destination to send the manual payout to —
// matches the PayoutInfo pattern already used on the Commissions page.
function PayoutDetails({ withdrawal }: { withdrawal: WithdrawalRow }) {
  const label =
    PAYOUT_METHOD_LABEL[withdrawal.payoutMethod] ?? withdrawal.payoutMethod;
  return (
    <div>
      <p className="font-semibold text-foreground">
        {withdrawal.payoutMethod === "BANK_TRANSFER" && withdrawal.payoutBankName
          ? `${label} — ${withdrawal.payoutBankName}`
          : label}
      </p>
      <p className="text-xs text-ink-400">
        {withdrawal.payoutAccountNumber ?? "—"}
        {withdrawal.payoutAccountName ? ` (${withdrawal.payoutAccountName})` : ""}
      </p>
    </div>
  );
}

export function WithdrawalsClient({ withdrawals }: { withdrawals: WithdrawalRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;
  const approvedCount = withdrawals.filter((w) => w.status === "APPROVED").length;
  const rejectedCount = withdrawals.filter((w) => w.status === "REJECTED").length;

  async function act(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    try {
      const response = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Unable to update withdrawal");
      }
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Withdrawals"
        description="Approve or reject creator withdrawal requests."
        breadcrumbs={[{ label: "Withdrawals" }]}
      />
      <KpiStrip
        items={[
          { label: "Pending", value: pendingCount.toLocaleString(), accent: "orange" },
          { label: "Approved", value: approvedCount.toLocaleString(), accent: "mint" },
          { label: "Rejected", value: rejectedCount.toLocaleString(), accent: "coral" },
        ]}
      />

      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Payout details</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-t border-border">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground">
                      {withdrawal.creator.creatorUsername
                        ? `@${withdrawal.creator.creatorUsername}`
                        : withdrawal.creator.name ?? "—"}
                    </p>
                    <p className="text-xs text-ink-400">{withdrawal.creator.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink-600">
                    {withdrawal.amountBirr} Birr
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    <PayoutDetails withdrawal={withdrawal} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={withdrawal.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-[8px] bg-card"
                        disabled={withdrawal.status !== "PENDING" || loadingId === withdrawal.id}
                        onClick={() => act(withdrawal.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-[8px] bg-card"
                        disabled={withdrawal.status !== "PENDING" || loadingId === withdrawal.id}
                        onClick={() => act(withdrawal.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No withdrawal requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
