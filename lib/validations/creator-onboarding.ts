import { z } from "zod";
import { normalizeUsername, usernameError } from "@/lib/username";
import { normalizeProfileLink, profileLinkError } from "@/lib/profile-link";
import { payoutChoiceFields } from "@/lib/payout-choice";

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
  // Social media profile link (lib/profile-link.ts); saved with https://
  // added when it was typed without one.
  profileUrl: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const message = profileLinkError(value);
      if (message) ctx.addIssue({ code: "custom", message });
    })
    .transform(normalizeProfileLink),
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
  // Payout: one option from the admin list + name + phone/account number.
  // The number format is checked against the chosen option by
  // resolvePayoutChoice (lib/payout-choice.ts) in the routes.
  ...payoutChoiceFields,
});

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
  });

// Settings → profile edit: same fields, username excluded.
export const creatorProfileSchema = profileFields;
