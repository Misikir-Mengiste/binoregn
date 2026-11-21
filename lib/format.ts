// Fixed locale + time zone for everything shown to people. Formatting
// with the device's own locale/time zone (bare toLocaleString()/
// toLocaleDateString()) makes the server HTML and a phone set to another
// region render different text, which breaks React hydration — and dates
// would shift with the server's time zone in production.
// Numbers: `n.toLocaleString("en-US")` → "16,000".
export const APP_TIME_ZONE = "Africa/Addis_Ababa";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

/** "12 Nov 2026" in Addis Ababa time. */
export function formatDate(value: Date | string | number) {
  return dateFormat.format(new Date(value));
}
