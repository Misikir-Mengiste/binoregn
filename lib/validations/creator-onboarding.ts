import { z } from "zod";
import { normalizeUsername, usernameError } from "@/lib/username";

// Everything a creator profile has except the username (Settings can't
// change the username, so it isn't validated or saved there).
const profileFields = z.object({
  fullName: z.string().trim().min(1).max(200),
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
});

type ProfileInput = z.infer<typeof profileFields>;

function requirePayoutFields(data: ProfileInput, ctx: z.RefinementCtx) {
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
}

// Onboarding (new creators): profile + username.
export const creatorOnboardingSchema = profileFields
  .extend({
    // Saved lowercase; rules in lib/username.ts.
    username: z
      .string()
      .transform(normalizeUsername)
      .superRefine((value, ctx) => {
        const message = usernameError(value);
        if (message) ctx.addIssue({ code: "custom", message });
      }),
  })
  .superRefine(requirePayoutFields);

// Settings → profile edit: same fields, username excluded.
export const creatorProfileSchema =
  profileFields.superRefine(requirePayoutFields);
