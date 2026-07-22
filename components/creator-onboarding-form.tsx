"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES, CREATOR_PLATFORMS } from "@/lib/creator-options";

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

export function CreatorOnboardingForm({
  email,
  initialValues,
}: {
  email: string;
  initialValues?: Partial<FormState>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    fullName: initialValues?.fullName ?? "",
    username: initialValues?.username ?? "",
    phone: initialValues?.phone ?? "",
    displayName: initialValues?.displayName ?? "",
    platform: initialValues?.platform ?? "",
    profileUrl: initialValues?.profileUrl ?? "",
    category: initialValues?.category ?? "",
    payoutMethod: initialValues?.payoutMethod ?? "TELEBIRR",
    telebirrPhone: initialValues?.telebirrPhone ?? "",
    bankName: initialValues?.bankName ?? "",
    bankAccountName: initialValues?.bankAccountName ?? "",
    bankAccountNumber: initialValues?.bankAccountNumber ?? "",
  });
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

  const progress = useMemo(
    () => ((step - 1) / 3) * 100,
    [step],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
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

      const response = await fetch("/api/creator/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not submit your profile");
      }
      router.push("/onboarding/pending");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[18px] bg-card px-6 py-7 shadow-card">
      <div className="flex items-center justify-between text-xs font-semibold text-ink-400">
        <span>STEP {step} OF 4</span>
        <span>
          {step === 1 ? "Personal" : step === 2 ? "Creator" : step === 3 ? "Payment" : "Review"}
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-pill bg-surface-100">
        <div
          className="h-full rounded-pill bg-teal-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step === 1 && (
        <div className="mt-6 flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Tell us about you</h1>
            <p className="mt-1 text-sm text-ink-600">
              A few details to set up your creator profile.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              className="h-12 rounded-[12px]"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Abebe Bekele"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              className="h-12 rounded-[12px]"
              value={form.username}
              onChange={(event) => updateField("username", event.target.value)}
              placeholder="abebe_creates"
            />
            <p className="text-xs text-ink-400">This is how brands will find you.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <div className="flex items-center gap-2">
              <div className="flex h-12 items-center rounded-[12px] border border-border bg-surface-100 px-3 text-sm font-semibold text-ink-600">
                +251
              </div>
              <Input
                id="phone"
                className="h-12 rounded-[12px]"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="911223344"
              />
            </div>
          </div>

          <Button
            type="button"
            className="h-12 rounded-[14px]"
            onClick={() => setStep(2)}
          >
            Continue
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 flex flex-col gap-5">
          <button
            type="button"
            className="text-sm text-ink-600"
            onClick={() => setStep(1)}
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Your creator presence</h1>
            <p className="mt-1 text-sm text-ink-600">Where and what do you create?</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              className="h-12 rounded-[12px]"
              value={form.displayName}
              onChange={(event) => updateField("displayName", event.target.value)}
              placeholder="Abebe Creates"
            />
            <p className="text-xs text-ink-400">The public name shown on your creator profile.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Primary platform</Label>
            <div className="grid grid-cols-2 gap-2">
              {CREATOR_PLATFORMS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField("platform", option.value)}
                  className={cn(
                    "h-11 rounded-[12px] border border-border text-sm font-semibold text-ink-600",
                    form.platform === option.value && "border-teal-600 bg-teal-100 text-teal-700",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profileUrl">Profile URL</Label>
            <Input
              id="profileUrl"
              className="h-12 rounded-[12px]"
              value={form.profileUrl}
              onChange={(event) => updateField("profileUrl", event.target.value)}
              placeholder="https://tiktok.com/@yourhandle"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Content category</Label>
            <select
              id="category"
              className="h-12 rounded-[12px] border border-border bg-card px-3 text-sm text-foreground"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              <option value="">Select a category</option>
              {CREATOR_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            className="h-12 rounded-[14px]"
            onClick={() => setStep(3)}
          >
            Continue
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 flex flex-col gap-5">
          <button
            type="button"
            className="text-sm text-ink-600"
            onClick={() => setStep(2)}
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">How you&apos;ll get paid</h1>
            <p className="mt-1 text-sm text-ink-600">We&apos;ll send your commissions here.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => updateField("payoutMethod", "TELEBIRR")}
              className={cn(
                "flex items-center justify-between rounded-[14px] border border-border px-4 py-4 text-left",
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
                "flex items-center justify-between rounded-[14px] border border-border px-4 py-4 text-left",
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
                <div className="flex h-12 items-center rounded-[12px] border border-border bg-surface-100 px-3 text-sm font-semibold text-ink-600">
                  +251
                </div>
                <Input
                  id="telebirrPhone"
                  className="h-12 rounded-[12px]"
                  value={form.telebirrPhone}
                  onChange={(event) => updateField("telebirrPhone", event.target.value)}
                  placeholder="911223344"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bankName">Bank name</Label>
                <select
                  id="bankName"
                  className="h-12 rounded-[12px] border border-border bg-card px-3 text-sm text-foreground"
                  value={form.bankName}
                  onChange={(event) => updateField("bankName", event.target.value)}
                >
                  <option value="">Select your bank</option>
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
                  className="h-12 rounded-[12px]"
                  value={form.bankAccountName}
                  onChange={(event) => updateField("bankAccountName", event.target.value)}
                  placeholder="Abebe Bekele"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bankAccountNumber">Account number</Label>
                <Input
                  id="bankAccountNumber"
                  className="h-12 rounded-[12px]"
                  value={form.bankAccountNumber}
                  onChange={(event) => updateField("bankAccountNumber", event.target.value)}
                  placeholder="1000123456789"
                />
              </div>
            </div>
          )}

          <Button
            type="button"
            className="h-12 rounded-[14px]"
            onClick={() => setStep(4)}
          >
            Continue
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <button
            type="button"
            className="text-sm text-ink-600"
            onClick={() => setStep(3)}
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Review & submit</h1>
            <p className="mt-1 text-sm text-ink-600">
              Check everything looks right before applying.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[14px] border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-teal-100 text-teal-700">
                <span className="text-xs font-bold">P</span>
              </span>
              Personal information
            </div>
            <div className="text-sm text-ink-600">
              <div className="flex items-center justify-between">
                <span>Full name</span>
                <span className="font-semibold text-foreground">{form.fullName}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Username</span>
                <span className="font-semibold text-foreground">@{form.username}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Phone</span>
                <span className="font-semibold text-foreground">+251 {form.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[14px] border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-teal-100 text-teal-700">
                <span className="text-xs font-bold">C</span>
              </span>
              Creator information
            </div>
            <div className="text-sm text-ink-600">
              <div className="flex items-center justify-between">
                <span>Display name</span>
                <span className="font-semibold text-foreground">{form.displayName}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Platform</span>
                <span className="font-semibold text-foreground">
                  {CREATOR_PLATFORMS.find((option) => option.value === form.platform)?.label ??
                    "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Profile</span>
                <span className="font-semibold text-foreground">{form.profileUrl}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Category</span>
                <span className="font-semibold text-foreground">{form.category}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[14px] border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-teal-100 text-teal-700">
                <span className="text-xs font-bold">$</span>
              </span>
              Payment information
            </div>
            <div className="text-sm text-ink-600">
              <div className="flex items-center justify-between">
                <span>Method</span>
                <span className="font-semibold text-foreground">
                  {form.payoutMethod === "TELEBIRR" ? walletName : "Bank transfer"}
                </span>
              </div>
              {form.payoutMethod === "TELEBIRR" ? (
                <div className="mt-2 flex items-center justify-between">
                  <span>Telebirr</span>
                  <span className="font-semibold text-foreground">
                    +251 {form.telebirrPhone}
                  </span>
                </div>
              ) : (
                <>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Bank</span>
                    <span className="font-semibold text-foreground">{form.bankName}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Account name</span>
                    <span className="font-semibold text-foreground">
                      {form.bankAccountName}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Account number</span>
                    <span className="font-semibold text-foreground">
                      {form.bankAccountNumber}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <label className="flex items-start gap-3 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>
              I agree to the <span className="font-semibold text-teal-700">Affiliate Program Terms</span>.
            </span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="h-12 rounded-[14px]"
            disabled={!agreed || loading}
          >
            {loading ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      )}
    </div>
  );
}
