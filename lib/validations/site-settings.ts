import { z } from "zod";

// Admin Settings → order confirmation phone. Digits with optional leading
// "+", spaces or dashes allowed for readability ("0911 22 33 44",
// "+251 911 223 344"). Empty clears it; showing requires a number.
export const PHONE_PATTERN = /^\+?[0-9][0-9 -]{5,18}[0-9]$/;

export const siteSettingsSchema = z
  .object({
    orderPhone: z
      .string()
      .trim()
      .max(25)
      .transform((value) => (value === "" ? null : value))
      .refine((value) => value === null || PHONE_PATTERN.test(value), {
        message: "Enter a valid phone number, e.g. 0911223344 or +251911223344",
      }),
    showOrderPhone: z.boolean(),
  })
  .refine((data) => !data.showOrderPhone || data.orderPhone !== null, {
    message: "Add a phone number before showing it",
    path: ["orderPhone"],
  });
