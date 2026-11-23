"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { PayoutLogo } from "@/components/payout-method-picker";

type PayoutOption = {
  id: string;
  category: "BANK" | "WALLET";
  name: string;
  isActive: boolean;
  logoUrl: string | null;
  createdAt: string;
};

function OptionSection({
  title,
  description,
  category,
  options,
  onCreated,
  onDeleted,
  onUpdated,
}: {
  title: string;
  description: string;
  category: "BANK" | "WALLET";
  options: PayoutOption[];
  onCreated: (option: PayoutOption) => void;
  onDeleted: (id: string) => void;
  // The list lives in local state, so updates come back through here
  // (router.refresh alone would not redraw it).
  onUpdated: (option: PayoutOption) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [logoBusyId, setLogoBusyId] = useState<string | null>(null);
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
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not update this option");
      }
      onUpdated({ ...option, isActive: body.data.isActive });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTogglingId(null);
    }
  }

  // Logo shown on the creator payout picker: upload the image (same
  // uploader as product photos), then save its path on the option.
  async function setLogo(option: PayoutOption, file: File | null) {
    setError(null);
    setLogoBusyId(option.id);
    try {
      let logoUrl: string | null = null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const upload = await fetch("/api/admin/uploads", { method: "POST", body: formData });
        const uploadBody = await upload.json().catch(() => null);
        if (!upload.ok) throw new Error(uploadBody?.error?.message ?? "Logo upload failed");
        logoUrl = uploadBody.data.url as string;
      }
      const response = await fetch(`/api/admin/payout-options/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not save the logo");
      }
      onUpdated({ ...option, logoUrl: body.data.logoUrl });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLogoBusyId(null);
    }
  }

  async function deleteOption(id: string) {
    const response = await fetch(`/api/admin/payout-options/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error?.message ?? "Could not delete this option");
    }
    onDeleted(id);
    router.refresh();
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
            <div className="flex min-w-0 items-center gap-2.5">
              <PayoutLogo option={option} size={32} />
              <span
                className={
                  option.isActive
                    ? "h-1.5 w-1.5 shrink-0 rounded-pill bg-mint-500"
                    : "h-1.5 w-1.5 shrink-0 rounded-pill bg-ink-400"
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
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <label
                className={
                  "inline-flex h-8 cursor-pointer items-center rounded-[8px] border border-border bg-card px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-100" +
                  (logoBusyId === option.id ? " pointer-events-none opacity-60" : "")
                }
              >
                {logoBusyId === option.id ? "Uploading…" : option.logoUrl ? "Change logo" : "Upload logo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void setLogo(option, file);
                  }}
                />
              </label>
              {option.logoUrl ? (
                <button
                  type="button"
                  className="text-xs text-ink-400 underline-offset-2 hover:text-coral-500 hover:underline"
                  disabled={logoBusyId === option.id}
                  onClick={() => void setLogo(option, null)}
                >
                  Remove logo
                </button>
              ) : null}
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
              <DeleteButton
                label="Delete option"
                onDelete={() => deleteOption(option.id)}
              />
            </div>
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
  children,
}: {
  banks: PayoutOption[];
  wallets: PayoutOption[];
  // Extra settings cards rendered under the header (e.g. Telegram).
  children?: React.ReactNode;
}) {
  const [banks, setBanks] = useState(initialBanks);
  const [wallets, setWallets] = useState(initialWallets);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage the payout methods creators choose from — shown to them as one list with logos."
        breadcrumbs={[{ label: "Settings" }]}
      />

      {children}

      <OptionSection
        title="Bank accounts"
        description="Creators who pick a bank enter the account holder name and account number."
        category="BANK"
        options={banks}
        onCreated={(option) => setBanks((prev) => [...prev, option])}
        onDeleted={(id) => setBanks((prev) => prev.filter((o) => o.id !== id))}
        onUpdated={(updated) => setBanks((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))}
      />

      <OptionSection
        title="Wallets"
        description="Mobile-money wallets (e.g. Telebirr): creators enter the account holder name and phone number."
        category="WALLET"
        options={wallets}
        onCreated={(option) => setWallets((prev) => [...prev, option])}
        onDeleted={(id) => setWallets((prev) => prev.filter((o) => o.id !== id))}
        onUpdated={(updated) => setWallets((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))}
      />
    </div>
  );
}
