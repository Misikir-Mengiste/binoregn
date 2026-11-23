"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES, CREATOR_PLATFORMS } from "@/lib/creator-options";
import {
  EMPTY_PAYOUT_CHOICE,
  PayoutMethodPicker,
  choiceFromSaved,
  payoutChoiceErrors,
  payoutChoicePayload,
  usePayoutOptions,
  type PayoutChoice,
  type SavedPayout,
} from "@/components/payout-method-picker";
import {
  PROFILE_LINK_EXAMPLE,
  profileLinkError,
  sanitizeProfileLinkInput,
} from "@/lib/profile-link";


type FormState = {
  fullName: string;
  username: string;
  phone: string;
  displayName: string;
  platform: string;
  profileUrl: string;
  category: string;
};

export function CreatorSettingsForm({
  initialValues,
  savedPayout,
}: {
  initialValues: FormState;
  savedPayout: SavedPayout;
}) {
  const [form, setForm] = useState<FormState>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Payout (components/payout-method-picker.tsx), pre-selected from what
  // the creator saved once the option list loads.
  const [payout, setPayout] = useState<PayoutChoice>(EMPTY_PAYOUT_CHOICE);
  const [payoutChecked, setPayoutChecked] = useState(false);
  const { options: payoutOptions, loaded: payoutLoaded } = usePayoutOptions((loadedOptions) =>
    setPayout((prev) => (prev.payoutOptionId ? prev : choiceFromSaved(savedPayout, loadedOptions))),
  );
  const payoutErrors = payoutChecked ? payoutChoiceErrors(payout, payoutOptions) : {};

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const problems = payoutChoiceErrors(payout, payoutOptions);
    const firstBad = (["payoutOptionId", "payoutAccountName", "payoutAccountNumber"] as const).find(
      (field) => problems[field],
    );
    if (firstBad) {
      setPayoutChecked(true);
      document.getElementById(firstBad)?.focus();
      return;
    }
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
        ...payoutChoicePayload(payout, payoutOptions),
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
            <Label htmlFor="profileUrl">Social media profile link</Label>
            <Input
              id="profileUrl"
              className="h-11 rounded-[10px]"
              value={form.profileUrl}
              onChange={(event) =>
                updateField("profileUrl", sanitizeProfileLinkInput(event.target.value))
              }
              placeholder={PROFILE_LINK_EXAMPLE}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <p
              className={cn(
                "text-xs",
                form.profileUrl && profileLinkError(form.profileUrl)
                  ? "font-medium text-coral-500"
                  : "text-ink-400",
              )}
            >
              {(form.profileUrl && profileLinkError(form.profileUrl)) ||
                `Copy the link from your profile page — e.g. ${PROFILE_LINK_EXAMPLE}`}
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
          <PayoutMethodPicker
            options={payoutOptions}
            loaded={payoutLoaded}
            value={payout}
            onChange={(next) => {
              setPayout(next);
              setSaved(false);
            }}
            errors={payoutErrors}
            inputClassName="h-11 rounded-[10px]"
          />
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
