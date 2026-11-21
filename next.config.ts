import type { NextConfig } from "next";

// HTTPS on every page (progress-tracker 2026-11-11): the TLS certificate
// and the http→https redirect live on the reverse proxy (nginx etc.) in
// front of `next start`. In production we additionally send HSTS so
// browsers refuse plain http for this site after their first visit.
// Not sent in dev, where the site runs on http://localhost.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Dev only: let phones/tablets on the same Wi-Fi open the dev server by
  // the PC's LAN address (e.g. http://192.168.1.121:4000). Without this,
  // Next blocks its dev scripts for non-localhost hosts, the page never
  // hydrates, and nothing interactive works. No effect on `next start`.
  allowedDevOrigins: ["192.168.*.*"],
  experimental: {
    // Dev only: Turbopack's on-disk dev cache repeatedly kept a stale route
    // list across restarts on this machine (nested dynamic API routes such
    // as /api/admin/products/[id] 404'd until .next/dev was deleted).
    // Rebuilding from scratch on each `npm run dev` is slightly slower but
    // reliable. No effect on `next build` / production.
    turbopackFileSystemCacheForDev: false,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
