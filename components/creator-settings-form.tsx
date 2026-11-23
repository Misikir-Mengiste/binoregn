"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES, CREATOR_PLATFORMS } from "@/lib/creator-options";
import { sanitizeSocialHandleInput, socialHandleError } from "@/lib/social-handle";

type PayoutOptionRow = { category: "BANK" | "WALLET"; name: string };

type FormState = {
  fullName: string;
  username: string;
  phone: string;
  displayName: string;
  platform: string;
  profileUrl: string;
  category: string;
  payoutMethod: "TELEBIRR" | "BANK_TRANSFER";
  telebirrPhone: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
};

export function CreatorSettingsForm({
  initialValues,
}: {
  initialValues: FormState;
}) {
  const [form, setForm] = useState<FormState>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bankOptions, setBankOptions] = useState<string[]>([]);
  const [walletOptions, setWalletOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/creator/payout-options")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data: PayoutOptionRow[] } | null) => {
        if (!body) return;
        setBankOptions(
          body.data.filter((o) => o.category === "BANK").map((o) => o.name),
        );
        setWalletOptions(
          body.data.filter((o) => o.category === "WALLET").map((o) => o.name),
        );
      })
      .catch(() => {});
  }, []);

  const walletName = walletOptions[0] ?? "Telebirr";

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        phone: `+251${form.phone.trim()}`,
        displayName: form.displayName.trim(),
        platform: form.platform,
        profileUrl: form.profileUrl.trim(),
        category: form.category.toUpperCase(),
        payoutMethod: form.payoutMethod,
        telebirrPhone:
          form.payoutMethod === "TELEBIRR" ? `+251${form.telebirrPhone.trim()}` : undefined,
        bankName: form.payoutMethod === "BANK_TRANSFER" ? form.bankName.trim() : undefined,
        bankAccountName:
          form.payoutMethod === "BANK_TRANSFER"
            ? form.bankAccountName.trim()
            : undefined,
        bankAccountNumber:
          form.payoutMethod === "BANK_TRANSFER"
            ? form.bankAccountNumber.trim()
            : undefined,
      };

      const response = await fetch("/api/creator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not update your profile");
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-[16px] border border-border bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-semibold text-foreground">Personal</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              className="h-11 rounded-[10px]"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              readOnly
              disabled
              className="h-11 cursor-not-allowed rounded-[10px] bg-surface-100 text-ink-400"
              value={form.username}
            />
            <p className="text-xs text-ink-400">
              Your username can&apos;t be changed.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <div className="flex items-center gap-2">
              <div className="flex h-11 items-center rounded-[10px] border border-border bg-surface-100 px-3 text-sm font-semibold text-ink-600">
                +251
              </div>
              <Input
                id="phone"
                className="h-11 rounded-[10px]"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-semibold text-foreground">Creator profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              className="h-11 rounded-[10px]"
              value={form.displayName}
              onChange={(event) => updateField("displayName", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label>Primary platform</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CREATOR_PLATFORMS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("platform", option.value)}
                  className={cn(
                    "h-10 rounded-[10px] border border-border text-sm font-semibold text-ink-600",
                    form.platform === option.value && "border-teal-600 bg-teal-100 text-teal-700",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="profileUrl">Social media username</Label>
            <Input
              id="profileUrl"
              className="h-11 rounded-[10px]"
              value={form.profileUrl}
              onChange={(event) =>
                updateField("profileUrl", sanitizeSocialHandleInput(event.target.value))
              }
              placeholder="@yourusername"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <p
              className={cn(
                "text-xs",
                form.profileUrl && socialHandleError(form.profileUrl)
                  ? "font-medium text-coral-500"
                  : "text-ink-400",
              )}
            >
              {(form.profileUrl && socialHandleError(form.profileUrl)) ||
                "Just your username, starting with @ — e.g. @abebe_creates."}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="category">Content category</Label>
            <select
              id="category"
              className="h-11 rounded-[10px] border border-border bg-card px-3 text-sm text-foreground"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {CREATOR_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-semibold text-foreground">Payout</h2>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => updateField("payoutMethod", "TELEBIRR")}
              className={cn(
                "flex items-center justify-between rounded-[12px] border border-border px-4 py-3 text-left",
                form.payoutMethod === "TELEBIRR" && "border-teal-600 bg-teal-100",
              )}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{walletName}</p>
                <p className="text-xs text-ink-600">Fast mobile-money payouts</p>
              </div>
              <div
                className={cn(
                  "h-4 w-4 rounded-full border border-border",
                  form.payoutMethod === "TELEBIRR" && "border-[5px] border-teal-600",
                )}
              />
            </button>
            <button
              type="button"
              onClick={() => updateField("payoutMethod", "BANK_TRANSFER")}
              className={cn(
                "flex items-center justify-between rounded-[12px] border border-border px-4 py-3 text-left",
                form.payoutMethod === "BANK_TRANSFER" && "border-teal-600 bg-teal-100",
              )}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">Bank transfer</p>
                <p className="text-xs text-ink-600">Direct to your bank account</p>
              </div>
              <div
                className={cn(
                  "h-4 w-4 rounded-full border border-border",
                  form.payoutMethod === "BANK_TRANSFER" && "border-[5px] border-teal-600",
                )}
              />
            </button>
          </div>

          {form.payoutMethod === "TELEBIRR" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telebirrPhone">{walletName} phone number</Label>
              <div className="flex items-center gap-2">
                <div className="flex h-11 items-center rounded-[10px] border border-border bg-surface-100 px-3 text-sm font-semibold text-ink-600">
                  +251
                </div>
                <Input
                  id="telebirrPhone"
                  className="h-11 rounded-[10px]"
                  value={form.telebirrPhone}
                  onChange={(event) => updateField("telebirrPhone", event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="bankName">Bank name</Label>
                <select
                  id="bankName"
                  className="h-11 rounded-[10px] border border-border bg-card px-3 text-sm text-foreground"
                  value={form.bankName}
                  onChange={(event) => updateField("bankName", event.target.value)}
                >
                  {bankOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bankAccountName">Account holder name</Label>
                <Input
                  id="bankAccountName"
                  className="h-11 rounded-[10px]"
                  value={form.bankAccountName}
                  onChange={(event) => updateField("bankAccountName", event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bankAccountNumber">Account number</Label>
                <Input
                  id="bankAccountNumber"
                  className="h-11 rounded-[10px]"
                  value={form.bankAccountNumber}
                  onChange={(event) => updateField("bankAccountNumber", event.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-mint-500">Profile updated.</p>}
      <Button type="submit" className="h-11 rounded-[10px]" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
