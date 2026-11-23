// How a creator's payout method is described everywhere (admin pages, Excel
// export, emails, creator earnings). Since 2026-11-23 creators pick one
// payout option from the admin's list (lib/payout-choice.ts) and its name is
// saved in payoutBankName for wallets and banks alike; payoutMethod only
// says the kind (wallet = phone number, bank = account number). Older rows
// may have no name saved — fall back to the old fixed labels.
const FALLBACK: Record<string, string> = {
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
  BANK_TRANSFER: "Bank transfer",
};

export function payoutProvider(details: {
  payoutMethod: string | null;
  payoutBankName: string | null;
}) {
  if (details.payoutBankName) return details.payoutBankName;
  if (details.payoutMethod) return FALLBACK[details.payoutMethod] ?? details.payoutMethod;
  return null;
}

/** Wallets are paid to a phone number; banks to an account number. */
export function isWalletMethod(payoutMethod: string | null) {
  return payoutMethod === "TELEBIRR" || payoutMethod === "CBE_BIRR";
}
