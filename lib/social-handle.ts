// Creator's social media username (user request 2026-11-23): only the
// handle, starting with "@" — e.g. "@abebe_creates". Stored in
// User.creatorProfileUrl (column name kept from when it held a full URL;
// older rows may still contain a URL). Shared by the sign-up/settings
// forms (live feedback), the API schema and the admin creator page.
export const SOCIAL_HANDLE_PATTERN = /^@[A-Za-z0-9._-]{2,50}$/;

/** As the creator types: spaces dropped. */
export function sanitizeSocialHandleInput(value: string) {
  return value.replace(/\s+/g, "");
}

/** Why a handle is invalid, or null if it's fine. */
export function socialHandleError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Enter your social media username.";
  if (/^https?:|\/|\.com\b/i.test(value)) {
    return "Enter just your username (e.g. @abebe_creates), not a link.";
  }
  if (!value.startsWith("@")) return "Your username must start with @ — e.g. @abebe_creates.";
  if (!SOCIAL_HANDLE_PATTERN.test(value)) {
    return "Use only letters, numbers, dots, dashes and underscores after the @.";
  }
  return null;
}

/** A link to the profile for admins, built from the platform + handle. */
export function socialProfileLink(platform: string | null, handle: string | null) {
  if (!handle) return null;
  if (/^https?:\/\//i.test(handle)) return handle; // older rows stored a URL
  const name = handle.replace(/^@/, "");
  switch (platform) {
    case "TIKTOK":
      return `https://www.tiktok.com/@${name}`;
    case "INSTAGRAM":
      return `https://www.instagram.com/${name}`;
    case "YOUTUBE":
      return `https://www.youtube.com/@${name}`;
    case "FACEBOOK":
      return `https://www.facebook.com/${name}`;
    case "TELEGRAM":
      return `https://t.me/${name}`;
    default:
      return null;
  }
}
