// Runs once when the Next.js server starts.
//
// Prefer IPv4 when resolving hostnames. Node otherwise tries the IPv6
// address first, and on networks with a broken IPv6 route (seen locally
// in Ethiopia, 2026-11-11) every request to api.telegram.org times out
// — so Telegram notifications would silently never arrive. IPv4-first
// is harmless where IPv6 works.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
