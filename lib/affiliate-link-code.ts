import { randomInt } from "node:crypto";

// Short public code for an affiliate link — the whole identifier in its
// URL, /r/[code] (see app/(public)/r/[slug]/page.tsx). Stored in
// AffiliateLink.slug. 62^7 ≈ 3.5 trillion combinations, so a collision
// is vanishingly rare; the unique index on `slug` still guards it and
// the caller retries (app/api/admin/applications/[id]/route.ts).
// Keep length/alphabet in sync with the backfill in
// prisma/migrations/*_short_affiliate_link_codes/migration.sql.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 7;

export function generateAffiliateLinkCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}
