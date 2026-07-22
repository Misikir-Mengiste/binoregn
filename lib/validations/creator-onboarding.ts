import { z } from "zod";

export const creatorOnboardingSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200),
    username: z.string().trim().min(2).max(60),
    phone: z.string().trim().min(8).max(32),
    displayName: z.string().trim().min(1).max(120),
    platform: z.enum([
      "TIKTOK",
      "INSTAGRAM",
      "YOUTUBE",
      "FACEBOOK",
      "TELEGRAM",
      "OTHER",
    ]),
    profileUrl: z.string().trim().url().max(300),
    category: z.enum([
      "TECH",
      "FASHION",
      "BEAUTY",
      "LIFESTYLE",
      "FOOD",
      "GAMING",
      "EDUCATION",
      "COMEDY",
      "OTHER",
    ]),
    payoutMethod: z.enum(["TELEBIRR", "BANK_TRANSFER"]),
    telebirrPhone: z.string().trim().min(8).max(32).optional(),
    bankName: z.string().trim().min(2).max(120).optional(),
    bankAccountName: z.string().trim().min(2).max(200).optional(),
    bankAccountNumber: z.string().trim().min(4).max(60).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payoutMethod === "TELEBIRR") {
      if (!data.telebirrPhone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Telebirr phone number is required.",
          path: ["telebirrPhone"],
        });
      }
    } else {
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bank name is required.",
          path: ["bankName"],
        });
      }
      if (!data.bankAccountName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account holder name is required.",
          path: ["bankAccountName"],
        });
      }
      if (!data.bankAccountNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Account number is required.",
          path: ["bankAccountNumber"],
        });
      }
    }
  });
