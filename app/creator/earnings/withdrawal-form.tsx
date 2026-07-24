"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PayoutMethod } from "@/generated/prisma/client";

type Method = "TELEBIRR" | "BANK_TRANSFER";

export function WithdrawalForm({
  availableBirr,
  payoutMethod,
  hasPayoutMethod,
}: {
  availableBirr: number;
  payoutMethod: PayoutMethod | null;
  hasPayoutMethod: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>(
    payoutMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "TELEBIRR",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const amountBirr = Number(amount);
      if (!Number.isFinite(amountBirr) || amountBirr <= 0) {
        throw new Error("Enter a valid amount.");
      }

      const response = await fetch("/api/creator/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountBirr, payoutMethod: method }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not submit withdrawal");
      }

      setSaved(true);
      setAmount("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="withdrawAmount">Withdrawal amount (ETB)</Label>
          <Input
            id="withdrawAmount"
            type="number"
            min={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded-[8px]"
          />
          <p className="text-xs text-ink-400">
            Available balance: {availableBirr} ETB
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="withdrawMethod">Withdraw method</Label>
          <select
            id="withdrawMethod"
            value={method}
            onChange={(event) => setMethod(event.target.value as Method)}
            className="h-10 rounded-[8px] border border-border bg-card px-3 text-sm text-ink-600 outline-none"
          >
            <option value="TELEBIRR">Telebirr</option>
            <option value="BANK_TRANSFER">Bank transfer</option>
          </select>
        </div>
      </div>

      {!hasPayoutMethod && (
        <p className="text-sm text-destructive">
          Add a payout method before requesting a withdrawal.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-mint-500">
          Withdrawal request submitted for admin approval.
        </p>
      )}
      <Button
        type="submit"
        disabled={loading || !hasPayoutMethod || availableBirr <= 0}
        className="w-fit"
      >
        {loading ? "Submitting…" : "Request withdrawal"}
      </Button>
    </form>
  );
}
