"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  PayoutMethodPicker,
  choiceFromSaved,
  describePayoutChoice,
  payoutChoiceErrors,
  payoutChoicePayload,
  usePayoutOptions,
  type PayoutOptionItem,
  type SavedPayout,
} from "@/components/payout-method-picker";
import { useRouter } from "next/navigation";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CREATOR_CATEGORIES, CREATOR_PLATFORMS } from "@/lib/creator-options";
import { Logo } from "@/components/logo";
import {
  USERNAME_HINT,
  normalizeUsername,
  sanitizeUsernameInput,
  usernameError,
} from "@/lib/username";
import {
  PROFILE_LINK_EXAMPLE,
  normalizeProfileLink,
  profileLinkError,
  sanitizeProfileLinkInput,
} from "@/lib/profile-link";


type FieldErrors = Partial<Record<keyof FormState, string>>;

// Ethiopian mobile number after +251: 9 digits starting 9 or 7. A leading 0
// ("0911…") is accepted and dropped.
function localPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 && digits.startsWith("0") ? digits.slice(1) : digits;
}
const PHONE_ERROR = "Enter your 9-digit phone number after +251, e.g. 911223344.";
const isPhone = (value: string) => /^[79]\d{8}$/.test(localPhone(value));

// What's missing or wrong on one step (empty object = OK to continue).
function stepErrors(step: number, form: FormState, payoutOptions: PayoutOptionItem[]): FieldErrors {
  const e: FieldErrors = {};
  if (step === 1) {
    if (form.fullName.trim().length < 2) e.fullName = "Enter your full name.";
    const u = usernameError(form.username);
    if (u) e.username = u;
    if (!form.phone.trim()) e.phone = "Enter your phone number.";
    else if (!isPhone(form.phone)) e.phone = PHONE_ERROR;
  }
  if (step === 2) {
    if (!form.displayName.trim()) e.displayName = "Enter your display name.";
    if (!form.platform) e.platform = "Choose your main platform.";
    const h = profileLinkError(form.profileUrl);
    if (h) e.profileUrl = h;
    if (!form.category) e.category = "Choose a content category.";
  }
  if (step === 3) {
    Object.assign(e, payoutChoiceErrors(form, payoutOptions));
  }
  return e;
}

// Field order per step, for focusing the first problem.
const STEP_FIELDS: Record<number, (keyof FormState)[]> = {
  1: ["fullName", "username", "phone"],
  2: ["displayName", "platform", "profileUrl", "category"],
  3: ["payoutOptionId", "payoutAccountName", "payoutAccountNumber"],
};

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-coral-500">
      {message}
    </p>
  );
}

type FormState = {
  fullName: string;
  username: string;
  phone: string;
  displayName: string;
  platform: string;
  profileUrl: string;
  category: string;
  // Payout (components/payout-method-picker.tsx).
  payoutOptionId: string;
  payoutAccountName: string;
  payoutAccountNumber: string;
};

export function CreatorOnboardingForm({
  initialValues,
  savedPayout,
}: {
  email: string;
  initialValues?: Partial<FormState>;
  /** Payout details saved earlier (re-applying after a rejection). */
  savedPayout?: SavedPayout;
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
    payoutOptionId: "",
    payoutAccountName: "",
    payoutAccountNumber: "",
  });
  // Once the list loads, pre-select what this creator saved before.
  const { options: payoutOptions, loaded: payoutLoaded } = usePayoutOptions((loadedOptions) => {
    if (!savedPayout) return;
    setForm((prev) =>
      prev.payoutOptionId ? prev : { ...prev, ...choiceFromSaved(savedPayout, loadedOptions) },
    );
  });
  // Only show the username error once they've typed or tried to continue.
  const [usernameTouched, setUsernameTouched] = useState(false);
  // Steps where Continue was pressed — their errors show (and update live).
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const errors = stepErrors(step, form, payoutOptions);
  const showErrors = checkedSteps.includes(step);
  const err = (field: keyof FormState) =>
    field === "username"
      ? usernameTouched || showErrors
        ? errors.username
        : undefined
      : showErrors
        ? errors[field]
        : undefined;
  const invalid = (field: keyof FormState) =>
    err(field) ? "border-coral-500 focus-visible:ring-coral-500/30" : "";

  function focusField(field: keyof FormState) {
    const el = document.getElementById(field) as HTMLElement | null;
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  // Continue: only move on when this step is complete; otherwise show
  // every problem on it and jump to the first one.
  function goNext() {
    const current = stepErrors(step, form, payoutOptions);
    const firstBad = STEP_FIELDS[step]?.find((field) => current[field]);
    if (firstBad) {
      setCheckedSteps((done) => (done.includes(step) ? done : [...done, step]));
      if (firstBad === "username") setUsernameTouched(true);
      focusField(firstBad);
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }
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
    // Re-check every step (in case something changed since).
    for (const s of [1, 2, 3]) {
      const problems = stepErrors(s, form, payoutOptions);
      const firstBad = STEP_FIELDS[s].find((field) => problems[field]);
      if (firstBad) {
        setCheckedSteps((done) => (done.includes(s) ? done : [...done, s]));
        setStep(s);
        setTimeout(() => focusField(firstBad), 0);
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: normalizeUsername(form.username),
        phone: `+251${localPhone(form.phone)}`,
        displayName: form.displayName.trim(),
        platform: form.platform,
        profileUrl: form.profileUrl.trim(),
        category: form.category.toUpperCase(),
        ...payoutChoicePayload(form, payoutOptions),
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
      <Logo className="mx-auto mb-6 h-7" />
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
              className={cn("h-12 rounded-[12px]", invalid("fullName"))}
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Abebe Bekele"
              aria-invalid={Boolean(err("fullName"))}
            />
            <FieldError message={err("fullName")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              className={cn("h-12 rounded-[12px]", invalid("username"))}
              value={form.username}
              onChange={(event) => {
                setUsernameTouched(true);
                updateField("username", sanitizeUsernameInput(event.target.value));
              }}
              placeholder="abebe_creates"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(err("username"))}
              aria-describedby="username-help"
            />
            {err("username") ? (
              <FieldError id="username-help" message={err("username")} />
            ) : (
              <p id="username-help" className="text-xs text-ink-400">
                {USERNAME_HINT}. This is how brands will find you.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <div className="flex items-center gap-2">
              <div className="flex h-12 items-center rounded-[12px] border border-border bg-surface-100 px-3 text-sm font-semibold text-ink-600">
                +251
              </div>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                className={cn("h-12 rounded-[12px]", invalid("phone"))}
                value={form.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="911223344"
                aria-invalid={Boolean(err("phone"))}
              />
            </div>
            <FieldError message={err("phone")} />
          </div>

          <Button
            type="button"
            className="h-12 rounded-[14px]"
            onClick={goNext}
          >
            Continue
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">Your creator presence</h1>
            <p className="mt-1 text-sm text-ink-600">Where and what do you create?</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              className={cn("h-12 rounded-[12px]", invalid("displayName"))}
              value={form.displayName}
              onChange={(event) => updateField("displayName", event.target.value)}
              placeholder="Abebe Creates"
              aria-invalid={Boolean(err("displayName"))}
            />
            {err("displayName") ? (
              <FieldError message={err("displayName")} />
            ) : (
              <p className="text-xs text-ink-400">The public name shown on your creator profile.</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Primary platform</Label>
            <div className="grid grid-cols-2 gap-2">
              {CREATOR_PLATFORMS.map((option, index) => (
                <button
                  key={option.value}
                  id={index === 0 ? "platform" : undefined}
                  type="button"
                  onClick={() => updateField("platform", option.value)}
                  className={cn(
                    "h-11 rounded-[12px] border border-border text-sm font-semibold text-ink-600",
                    form.platform === option.value && "border-teal-600 bg-teal-100 text-teal-700",
                    err("platform") && "border-coral-500",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <FieldError message={err("platform")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profileUrl">Social media profile link</Label>
            <Input
              id="profileUrl"
              className={cn("h-12 rounded-[12px]", invalid("profileUrl"))}
              value={form.profileUrl}
              onChange={(event) =>
                updateField("profileUrl", sanitizeProfileLinkInput(event.target.value))
              }
              placeholder={PROFILE_LINK_EXAMPLE}
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(err("profileUrl"))}
            />
            {err("profileUrl") ? (
              <FieldError message={err("profileUrl")} />
            ) : (
              <p className="text-xs text-ink-400">
                Copy the link from your profile page — e.g. {PROFILE_LINK_EXAMPLE}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Content category</Label>
            <select
              id="category"
              className={cn(
                "h-12 rounded-[12px] border border-border bg-card px-3 text-sm text-foreground",
                invalid("category"),
              )}
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
              aria-invalid={Boolean(err("category"))}
            >
              <option value="">Select a category</option>
              {CREATOR_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError message={err("category")} />
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-[14px]"
              onClick={() => setStep(1)}
            >
              ← Back
            </Button>
            <Button
              type="button"
              className="h-12 flex-[2] rounded-[14px]"
              onClick={goNext}
            >
              Continue
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 flex flex-col gap-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">How you&apos;ll get paid</h1>
            <p className="mt-1 text-sm text-ink-600">We&apos;ll send your commissions here.</p>
          </div>

          <PayoutMethodPicker
            options={payoutOptions}
            loaded={payoutLoaded}
            value={form}
            onChange={(next) =>
              setForm((prev) => ({
                ...prev,
                payoutOptionId: next.payoutOptionId,
                payoutAccountName: next.payoutAccountName,
                payoutAccountNumber: next.payoutAccountNumber,
              }))
            }
            errors={{
              payoutOptionId: err("payoutOptionId"),
              payoutAccountName: err("payoutAccountName"),
              payoutAccountNumber: err("payoutAccountNumber"),
            }}
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-[14px]"
              onClick={() => setStep(2)}
            >
              ← Back
            </Button>
            <Button
              type="button"
              className="h-12 flex-[2] rounded-[14px]"
              onClick={goNext}
            >
              Continue
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
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
                <span className="font-semibold text-foreground">+251 {localPhone(form.phone)}</span>
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
                <span>Profile link</span>
                <span className="min-w-0 truncate pl-3 font-semibold text-foreground">
                  {normalizeProfileLink(form.profileUrl)}
                </span>
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
                  {describePayoutChoice(form, payoutOptions)?.provider ?? "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Account name</span>
                <span className="font-semibold text-foreground">{form.payoutAccountName}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>
                  {describePayoutChoice(form, payoutOptions)?.kind === "WALLET"
                    ? "Phone number"
                    : "Account number"}
                </span>
                <span className="font-semibold text-foreground">
                  {describePayoutChoice(form, payoutOptions)?.number}
                </span>
              </div>
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

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-[14px]"
              onClick={() => setStep(3)}
            >
              ← Back
            </Button>
            <Button
              type="submit"
              className="h-12 flex-[2] rounded-[14px]"
              disabled={!agreed || loading}
            >
              {loading ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
