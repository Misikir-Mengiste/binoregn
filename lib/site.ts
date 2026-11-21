// Public contact details, shown on buyer pages, the confirmation screen
// and creator status pages ("visible contact info", progress-tracker
// 2026-11-11). Set the env vars to your real details; NEXT_PUBLIC_ so
// client components can read them too.
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@binoregn.com";
export const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || null;
