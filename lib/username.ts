// Creator username rules (user request 2026-11-21), shared by the
// onboarding form (live feedback) and the API (creatorOnboardingSchema):
//   - lowercase letters and underscores; numbers only at the end
//   - must start with a letter (never a number), no spaces
//   - always saved lowercase ("Betty_Picks22" → "betty_picks22")
// e.g. ok: betty, betty_picks, betty_picks22 · not ok: 22betty,
// betty picks, be2tty, _betty.
export const USERNAME_MIN = 2;
export const USERNAME_MAX = 60;
export const USERNAME_PATTERN = /^[a-z][a-z_]*[0-9]*$/;

export const USERNAME_HINT =
  "Letters and underscores, numbers only at the end — e.g. abebe_creates22";

/** What we store: trimmed and lowercased. */
export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

/** As the creator types: lowercase, spaces dropped. */
export function sanitizeUsernameInput(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

/** Why a (normalized) username is invalid, or null if it's fine. */
export function usernameError(raw: string): string | null {
  const value = normalizeUsername(raw);
  if (value.length === 0) return "Choose a username.";
  if (/\s/.test(value)) return "Spaces aren't allowed in a username.";
  if (/^[0-9]/.test(value)) return "Username can't start with a number.";
  if (!/^[a-z]/.test(value)) return "Username must start with a letter.";
  if (/[^a-z0-9_]/.test(value)) {
    return "Use only letters, underscores, and numbers.";
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "Numbers can only go at the end of your username.";
  }
  if (value.length < USERNAME_MIN) {
    return `Username must be at least ${USERNAME_MIN} characters.`;
  }
  if (value.length > USERNAME_MAX) {
    return `Username must be at most ${USERNAME_MAX} characters.`;
  }
  return null;
}
