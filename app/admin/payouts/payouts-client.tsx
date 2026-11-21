"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DuePayout } from "@/lib/commission/payouts";

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
};

type RecentPayout = {
  id: string;
  amountBirr: number;
  paidAt: string;
  payoutMethod: string | null;
  commissionCount: number;
  creatorName: string;
};

function PayoutAccount({ row }: { row: DuePayout }) {
  if (!row.payoutMethod || !row.payoutAccountNumber) {
    return <span className="text-xs font-medium text-orange-500">No payout details</span>;
  }
  const label = METHOD_LABELS[row.payoutMethod] ?? row.payoutMethod;
  return (
    <div className="text-xs text-ink-600">
      <p className="font-medium text-foreground">
        {row.payoutBankName ? `${label} (${row.payoutBankName})` : label}
      </p>
      <p>
        {row.payoutAccountNumber}
        {row.payoutAccountName ? ` · ${row.payoutAccountName}` : ""}
      </p>
    </div>
  );
}

export function PayoutsClient({
  cutoff,
  due,
  recent,
}: {
  cutoff: string;
  due: DuePayout[];
  recent: RecentPayout[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markPaid(creatorIds: string[], key: string) {
    setBusy(key);
    setError(null);
    try {
      const response = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cutoff, creatorIds }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not record the payout");
      }
      const failed = (body?.data?.results ?? []).filter(
        (result: { ok: boolean }) => !result.ok,
      );
      if (failed.length > 0) {
        setError(`${failed.length} payout(s) were not recorded: ${failed[0].error}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  function markAllPaid() {
    const total = due.reduce((sum, row) => sum + row.amountBirr, 0);
    if (
      !window.confirm(
        `Mark all ${due.length} creators as paid (${total.toLocaleString("en-US")} ETB)? Only do this after you've sent the money.`,
      )
    ) {
      return;
    }
    markPaid(
      due.map((row) => row.creatorId),
      "ALL",
    );
  }

  function markOnePaid(row: DuePayout) {
    if (
      !window.confirm(
        `Mark ${row.creatorName} as paid ${row.amountBirr.toLocaleString("en-US")} ETB? Only do this after you've sent the money.`,
      )
    ) {
      return;
    }
    markPaid([row.creatorId], row.creatorId);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Ready to pay</h2>
            <p className="text-xs text-ink-400">
              Download the list, pay each creator, then mark them paid.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/payouts/export"
              className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-border bg-card px-3 text-sm font-semibold text-foreground hover:bg-surface-100"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </a>
            <Button
              size="sm"
              className="h-9 rounded-[8px]"
              disabled={due.length === 0 || busy !== null}
              onClick={markAllPaid}
            >
              {busy === "ALL" ? "Saving…" : "Mark all paid"}
            </Button>
          </div>
        </div>
        {error ? <p className="px-5 pt-3 text-sm text-destructive">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Pay to</th>
                <th className="px-5 py-3 font-medium">Commissions</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {due.map((row) => (
                <tr key={row.creatorId} className="border-t border-border">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground">{row.creatorName}</p>
                    <p className="text-xs text-ink-400">
                      {row.creatorPhone ?? row.creatorEmail}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <PayoutAccount row={row} />
                  </td>
                  <td className="px-5 py-3.5 text-ink-600">
                    {row.commissionCount.toLocaleString("en-US")}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">
                    {row.amountBirr.toLocaleString("en-US")} ETB
                  </td>
                  <td className="px-5 py-3.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-[8px]"
                      disabled={busy !== null}
                      onClick={() => markOnePaid(row)}
                    >
                      {busy === row.creatorId ? "Saving…" : "Mark paid"}
                    </Button>
                  </td>
                </tr>
              ))}
              {due.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    Nobody is due right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">Recent payouts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Commissions</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Paid on</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((payout) => (
                <tr key={payout.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {payout.creatorName}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {payout.payoutMethod
                      ? METHOD_LABELS[payout.payoutMethod] ?? payout.payoutMethod
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {payout.commissionCount.toLocaleString("en-US")}
                  </td>
                  <td className="px-5 py-3 font-semibold text-foreground">
                    {payout.amountBirr.toLocaleString("en-US")} ETB
                  </td>
                  <td className="px-5 py-3 text-ink-600">{payout.paidAt}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    No payouts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
