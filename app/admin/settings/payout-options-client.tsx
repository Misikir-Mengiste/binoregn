"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";

type PayoutOption = {
  id: string;
  category: "BANK" | "WALLET";
  name: string;
  isActive: boolean;
  createdAt: string;
};

function OptionSection({
  title,
  description,
  category,
  options,
  onCreated,
}: {
  title: string;
  description: string;
  category: "BANK" | "WALLET";
  options: PayoutOption[];
  onCreated: (option: PayoutOption) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const response = await fetch("/api/admin/payout-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name: trimmed }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not add this option");
      }
      onCreated(body.data);
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(option: PayoutOption) {
    setTogglingId(option.id);
    try {
      const response = await fetch(`/api/admin/payout-options/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !option.isActive }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not update this option");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <header className="border-b border-border px-5 py-3.5">
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
        <p className="text-xs text-ink-400">{description}</p>
      </header>

      <div className="divide-y divide-border">
        {options.map((option) => (
          <div
            key={option.id}
            className="flex items-center justify-between px-5 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={
                  option.isActive
                    ? "h-1.5 w-1.5 rounded-pill bg-mint-500"
                    : "h-1.5 w-1.5 rounded-pill bg-ink-400"
                }
              />
              <p
                className={
                  option.isActive
                    ? "text-sm font-medium text-foreground"
                    : "text-sm font-medium text-ink-400"
                }
              >
                {option.name}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-[8px] bg-card"
              disabled={togglingId === option.id}
              onClick={() => toggleActive(option)}
            >
              {togglingId === option.id
                ? "Saving…"
                : option.isActive
                  ? "Deactivate"
                  : "Activate"}
            </Button>
          </div>
        ))}
        {options.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            No options yet.
          </p>
        )}
      </div>

      <form
        onSubmit={handleCreate}
        className="flex items-center gap-2 border-t border-border bg-surface-100 px-5 py-3"
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={
            category === "BANK" ? "e.g. Zemen Bank" : "e.g. M-Pesa"
          }
          className="h-9 rounded-[8px] bg-card"
        />
        <Button
          type="submit"
          size="sm"
          className="h-9 shrink-0 rounded-[8px]"
          disabled={creating || !name.trim()}
        >
          {creating ? "Adding…" : "Add"}
        </Button>
      </form>
      {error && (
        <p className="border-t border-border px-5 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

export function PayoutOptionsClient({
  banks: initialBanks,
  wallets: initialWallets,
}: {
  banks: PayoutOption[];
  wallets: PayoutOption[];
}) {
  const [banks, setBanks] = useState(initialBanks);
  const [wallets, setWallets] = useState(initialWallets);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage the bank and wallet options creators can choose from for payouts."
        breadcrumbs={[{ label: "Settings" }]}
      />

      <OptionSection
        title="Bank accounts"
        description="Banks creators can select when they choose bank transfer as their payout method."
        category="BANK"
        options={banks}
        onCreated={(option) => setBanks((prev) => [...prev, option])}
      />

      <OptionSection
        title="Wallets"
        description="Mobile-money wallets (e.g. Telebirr) creators can select for wallet payouts."
        category="WALLET"
        options={wallets}
        onCreated={(option) => setWallets((prev) => [...prev, option])}
      />
    </div>
  );
}
