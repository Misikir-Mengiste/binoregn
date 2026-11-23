import { z } from "zod";
import { prisma } from "@/lib/prisma";

// A creator's payout choice (2026-11-23): one option from the admin's list
// (PayoutOption — banks and wallets together) + account holder name + either
// a phone number (wallets, e.g. Telebirr) or an account number (banks).
// Used by sign-up (/api/creator/onboarding) and Settings
// (/api/creator/profile, /api/creator/payout-method).
export const payoutChoiceFields = {
  payoutOptionId: z.string().trim().min(1, "Choose how you want to be paid."),
  payoutAccountName: z
    .string()
    .trim()
    .min(2, "Enter the account holder name.")
    .max(200),
  payoutAccountNumber: z.string().trim().min(1, "Enter the payout number.").max(60),
};

export const payoutChoiceSchema = z.object(payoutChoiceFields);

/** "+251…" from "+251911…", "0911…", "911…" (spaces/dashes ignored). */
export function normalizeWalletPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("251") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10 && digits.startsWith("0")) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  return null;
}

type Choice = { payoutOptionId: string; payoutAccountName: string; payoutAccountNumber: string };

/**
 * Checks the choice against the live option list and returns the User
 * fields to save, or an error message for the creator.
 */
export async function resolvePayoutChoice(choice: Choice) {
  const option = await prisma.payoutOption.findFirst({
    where: { id: choice.payoutOptionId, isActive: true },
    select: { category: true, name: true },
  });
  if (!option) {
    return { ok: false, error: "That payout method is no longer available — please choose another." } as const;
  }

  let number = choice.payoutAccountNumber.trim();
  if (option.category === "WALLET") {
    const phone = normalizeWalletPhone(number);
    if (!phone || !/^\+251[79]\d{8}$/.test(phone)) {
      return { ok: false, error: `Enter your ${option.name} phone number — 9 digits after +251, e.g. 911223344.` } as const;
    }
    number = phone;
  } else {
    number = number.replace(/[\s-]/g, "");
    if (!/^\d{4,30}$/.test(number)) {
      return { ok: false, error: `Enter your ${option.name} account number (numbers only).` } as const;
    }
  }

  return {
    ok: true,
    fields: {
      // Kind only (wallet vs bank); the option's name is the provider.
      payoutMethod: option.category === "WALLET" ? ("TELEBIRR" as const) : ("BANK_TRANSFER" as const),
      payoutBankName: option.name,
      payoutAccountName: choice.payoutAccountName.trim(),
      payoutAccountNumber: number,
    },
  } as const;
}
