import { z } from "zod";

// Discriminated union: BANK_TRANSFER needs a bank name,
// TELEBIRR/CBE_BIRR don't (the "account number" is a phone number
// for those).
export const payoutMethodSchema = z.discriminatedUnion("payoutMethod", [
  z.object({
    payoutMethod: z.literal("BANK_TRANSFER"),
    payoutAccountName: z.string().trim().min(1).max(200),
    payoutAccountNumber: z.string().trim().min(1).max(50),
    payoutBankName: z.string().trim().min(1).max(200),
  }),
  z.object({
    payoutMethod: z.literal("TELEBIRR"),
    payoutAccountName: z.string().trim().min(1).max(200),
    payoutAccountNumber: z.string().trim().min(1).max(50),
  }),
  z.object({
    payoutMethod: z.literal("CBE_BIRR"),
    payoutAccountName: z.string().trim().min(1).max(200),
    payoutAccountNumber: z.string().trim().min(1).max(50),
  }),
]);
