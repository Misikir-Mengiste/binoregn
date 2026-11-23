"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Creator payout picker (2026-11-23): every payout option the admin enabled
// (banks and wallets together) as logo tiles. Wallets (e.g. Telebirr) ask
// account holder name + phone; banks (e.g. CBE) ask name + account number.
// Used by sign-up step 3 and creator Settings. Server check:
// lib/payout-choice.ts.

export type PayoutOptionItem = {
  id: string;
  category: "BANK" | "WALLET";
  name: string;
  logoUrl: string | null;
};

export type PayoutChoice = {
  payoutOptionId: string;
  payoutAccountName: string;
  /** Wallets: the 9 digits after +251. Banks: the account number. */
  payoutAccountNumber: string;
};

export type PayoutChoiceErrors = Partial<Record<keyof PayoutChoice, string>>;

export type SavedPayout = {
  payoutMethod: string | null;
  payoutBankName: string | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
};

export const EMPTY_PAYOUT_CHOICE: PayoutChoice = {
  payoutOptionId: "",
  payoutAccountName: "",
  payoutAccountNumber: "",
};

/**
 * Loads the active options (logos included) once. `onLoaded` runs with the
 * list when it arrives — used to pre-select a creator's saved choice.
 */
export function usePayoutOptions(onLoaded?: (options: PayoutOptionItem[]) => void) {
  const [options, setOptions] = useState<PayoutOptionItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    fetch("/api/creator/payout-options")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data: PayoutOptionItem[] } | null) => {
        if (body) {
          // Wallets first (most creators use Telebirr), then banks.
          const sorted = [...body.data].sort((a, b) =>
            a.category === b.category ? 0 : a.category === "WALLET" ? -1 : 1,
          );
          setOptions(sorted);
          onLoadedRef.current?.(sorted);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  return { options, loaded };
}

function localPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("251")) return digits.slice(3);
  if (digits.length === 10 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/** A creator's saved details → a choice in the current option list. */
export function choiceFromSaved(saved: SavedPayout | undefined, options: PayoutOptionItem[]): PayoutChoice {
  if (!saved || !saved.payoutMethod) return EMPTY_PAYOUT_CHOICE;
  const byName = (name: string) =>
    options.find((o) => o.name.trim().toLowerCase() === name.trim().toLowerCase());
  const option =
    (saved.payoutBankName && byName(saved.payoutBankName)) ||
    (saved.payoutMethod === "TELEBIRR" ? byName("Telebirr") : undefined);
  if (!option) return { ...EMPTY_PAYOUT_CHOICE, payoutAccountName: saved.payoutAccountName ?? "" };
  return {
    payoutOptionId: option.id,
    payoutAccountName: saved.payoutAccountName ?? "",
    payoutAccountNumber:
      option.category === "WALLET"
        ? localPhone(saved.payoutAccountNumber ?? "")
        : (saved.payoutAccountNumber ?? ""),
  };
}

/** What's missing or wrong (empty object = OK). */
export function payoutChoiceErrors(choice: PayoutChoice, options: PayoutOptionItem[]): PayoutChoiceErrors {
  const e: PayoutChoiceErrors = {};
  const option = options.find((o) => o.id === choice.payoutOptionId);
  if (!option) {
    e.payoutOptionId = "Choose how you want to be paid.";
    return e;
  }
  if (choice.payoutAccountName.trim().length < 2) {
    e.payoutAccountName = "Enter the account holder name.";
  }
  const number = choice.payoutAccountNumber.trim();
  if (option.category === "WALLET") {
    if (!number) e.payoutAccountNumber = `Enter your ${option.name} phone number.`;
    else if (!/^[79]\d{8}$/.test(localPhone(number))) {
      e.payoutAccountNumber = "Enter the 9 digits after +251, e.g. 911223344.";
    }
  } else if (!number) {
    e.payoutAccountNumber = `Enter your ${option.name} account number.`;
  } else if (!/^\d{4,30}$/.test(number)) {
    e.payoutAccountNumber = "Account number: numbers only.";
  }
  return e;
}

/** The API body for this choice. */
export function payoutChoicePayload(choice: PayoutChoice, options: PayoutOptionItem[]) {
  const option = options.find((o) => o.id === choice.payoutOptionId);
  const number = choice.payoutAccountNumber.trim();
  return {
    payoutOptionId: choice.payoutOptionId,
    payoutAccountName: choice.payoutAccountName.trim(),
    payoutAccountNumber: option?.category === "WALLET" ? `+251${localPhone(number)}` : number,
  };
}

/** For a review/summary line: "Telebirr · +251 911223344". */
export function describePayoutChoice(choice: PayoutChoice, options: PayoutOptionItem[]) {
  const option = options.find((o) => o.id === choice.payoutOptionId);
  if (!option) return null;
  const number =
    option.category === "WALLET"
      ? `+251 ${localPhone(choice.payoutAccountNumber)}`
      : choice.payoutAccountNumber.trim();
  return { provider: option.name, number, kind: option.category };
}

export function PayoutLogo({ option, size = 40 }: { option: Pick<PayoutOptionItem, "name" | "logoUrl">; size?: number }) {
  return option.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={option.logoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-[10px] bg-white object-contain"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-teal-100 font-bold text-teal-700"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {option.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function PayoutMethodPicker({
  options,
  loaded,
  value,
  onChange,
  errors = {},
  inputClassName = "h-12 rounded-[12px]",
}: {
  options: PayoutOptionItem[];
  loaded: boolean;
  value: PayoutChoice;
  onChange: (next: PayoutChoice) => void;
  errors?: PayoutChoiceErrors;
  inputClassName?: string;
}) {
  const selected = options.find((o) => o.id === value.payoutOptionId);
  const errText = (message?: string) =>
    message ? <p className="text-xs font-medium text-coral-500">{message}</p> : null;
  const bad = "border-coral-500 focus-visible:ring-coral-500/30";

  if (loaded && options.length === 0) {
    return (
      <p className="rounded-[12px] border border-border bg-surface-100 px-4 py-3 text-sm text-ink-600">
        No payout methods are available yet. Please contact us and we&apos;ll set one up for you.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Choose how you want to be paid</Label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup">
          {!loaded
            ? [0, 1].map((i) => (
                <div key={i} className="h-[88px] animate-pulse rounded-[14px] bg-surface-100" />
              ))
            : options.map((option, index) => {
                const active = option.id === value.payoutOptionId;
                return (
                  <button
                    key={option.id}
                    id={index === 0 ? "payoutOptionId" : undefined}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() =>
                      onChange({
                        ...value,
                        payoutOptionId: option.id,
                        // A phone and an account number aren't interchangeable.
                        payoutAccountNumber:
                          selected && selected.category !== option.category ? "" : value.payoutAccountNumber,
                      })
                    }
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-[14px] border bg-card px-2 py-3 text-center transition-colors",
                      active ? "border-teal-600 bg-teal-100/60 ring-1 ring-teal-600" : "border-border hover:border-teal-500",
                      errors.payoutOptionId && "border-coral-500",
                    )}
                  >
                    {active ? (
                      <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                    <PayoutLogo option={option} />
                    <span className="text-sm font-semibold text-foreground">{option.name}</span>
                    <span className="text-[11px] text-ink-400">
                      {option.category === "WALLET" ? "Mobile wallet" : "Bank account"}
                    </span>
                  </button>
                );
              })}
        </div>
        {errText(errors.payoutOptionId)}
      </div>

      {selected ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payoutAccountName">Account holder name</Label>
            <Input
              id="payoutAccountName"
              className={cn(inputClassName, errors.payoutAccountName && bad)}
              value={value.payoutAccountName}
              onChange={(event) => onChange({ ...value, payoutAccountName: event.target.value })}
              placeholder="Abebe Bekele"
              autoComplete="name"
              aria-invalid={Boolean(errors.payoutAccountName)}
            />
            {errText(errors.payoutAccountName)}
          </div>

          {selected.category === "WALLET" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payoutAccountNumber">{selected.name} phone number</Label>
              <div className="flex items-center gap-2">
                <div className="flex h-full min-h-11 items-center self-stretch rounded-[12px] border border-border bg-surface-100 px-3 text-sm font-semibold text-ink-600">
                  +251
                </div>
                <Input
                  id="payoutAccountNumber"
                  type="tel"
                  inputMode="numeric"
                  className={cn(inputClassName, errors.payoutAccountNumber && bad)}
                  value={value.payoutAccountNumber}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      payoutAccountNumber: event.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="911223344"
                  aria-invalid={Boolean(errors.payoutAccountNumber)}
                />
              </div>
              {errText(errors.payoutAccountNumber)}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payoutAccountNumber">{selected.name} account number</Label>
              <Input
                id="payoutAccountNumber"
                inputMode="numeric"
                className={cn(inputClassName, errors.payoutAccountNumber && bad)}
                value={value.payoutAccountNumber}
                onChange={(event) =>
                  onChange({ ...value, payoutAccountNumber: event.target.value.replace(/[\s-]/g, "") })
                }
                placeholder="1000123456789"
                aria-invalid={Boolean(errors.payoutAccountNumber)}
              />
              {errText(errors.payoutAccountNumber)}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
