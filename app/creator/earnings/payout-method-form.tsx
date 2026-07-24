"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Method = "BANK_TRANSFER" | "TELEBIRR" | "CBE_BIRR";

const METHOD_OPTIONS: { value: Method; label: string }[] = [
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "TELEBIRR", label: "Telebirr" },
  { value: "CBE_BIRR", label: "CBE ETB" },
];

export function PayoutMethodForm({
  initial,
}: {
  initial: {
    payoutMethod: Method | null;
    payoutAccountName: string | null;
    payoutAccountNumber: string | null;
    payoutBankName: string | null;
  };
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>(
    initial.payoutMethod ?? "BANK_TRANSFER",
  );
  const [accountName, setAccountName] = useState(
    initial.payoutAccountName ?? "",
  );
  const [accountNumber, setAccountNumber] = useState(
    initial.payoutAccountNumber ?? "",
  );
  const [bankName, setBankName] = useState(initial.payoutBankName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const body =
        method === "BANK_TRANSFER"
          ? {
              payoutMethod: method,
              payoutAccountName: accountName,
              payoutAccountNumber: accountNumber,
              payoutBankName: bankName,
            }
          : {
              payoutMethod: method,
              payoutAccountName: accountName,
              payoutAccountNumber: accountNumber,
            };

      const response = await fetch("/api/creator/payout-method", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.error?.message ?? "Could not save your payout method",
        );
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="method">Payout method</Label>
        <select
          id="method"
          value={method}
          onChange={(event) => setMethod(event.target.value as Method)}
          className="h-9 rounded-[8px] border border-border bg-card px-3 text-sm text-ink-600 outline-none"
        >
          {METHOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {method === "BANK_TRANSFER" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bankName">Bank name</Label>
          <Input
            id="bankName"
            required
            className="rounded-[8px]"
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="accountName">Account holder name</Label>
        <Input
          id="accountName"
          required
          className="rounded-[8px]"
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="accountNumber">
          {method === "BANK_TRANSFER" ? "Account number" : "Phone number"}
        </Label>
        <Input
          id="accountNumber"
          required
          className="rounded-[8px]"
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-mint-500">Payout method saved.</p>
      )}
      <Button type="submit" disabled={saving} className="w-fit">
        {saving ? "Saving…" : "Save payout method"}
      </Button>
    </form>
  );
}
