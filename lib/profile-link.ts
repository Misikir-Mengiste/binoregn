// Creator's social media profile link (user request 2026-11-23, replacing
// the short-lived "@username" field): a full link such as
// https://www.tiktok.com/@abebe_creates. Stored in User.creatorProfileUrl.
// "https://" is added when someone types just "tiktok.com/@name".
// Shared by the sign-up/settings forms (live feedback), the API schema and
// the admin creator page.
export const PROFILE_LINK_EXAMPLE = "https://www.tiktok.com/@abebe_creates";

/** As the creator types: spaces dropped. */
export function sanitizeProfileLinkInput(value: string) {
  return value.replace(/\s+/g, "");
}

/** What we store: trimmed, with https:// added when no scheme was typed. */
export function normalizeProfileLink(raw: string) {
  const value = raw.trim();
  if (!value) return value;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
}

/** Why a profile link is invalid, or null if it's fine. */
export function profileLinkError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Paste the link to your social media profile.";
  if (value.startsWith("@")) {
    return `Paste the full link to your profile, not just the username — e.g. ${PROFILE_LINK_EXAMPLE}`;
  }
  if (value.length > 300) return "That link is too long.";
  let url: URL;
  try {
    url = new URL(normalizeProfileLink(value));
  } catch {
    return `That doesn't look like a link — e.g. ${PROFILE_LINK_EXAMPLE}`;
  }
  if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) {
    return `That doesn't look like a link — e.g. ${PROFILE_LINK_EXAMPLE}`;
  }
  return null;
}

/** A clickable link for admins, or null for values that aren't links. */
export function profileLinkHref(value: string | null) {
  if (!value || profileLinkError(value)) return null;
  return normalizeProfileLink(value);
}
