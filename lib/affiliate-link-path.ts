// Public URL path of an affiliate link — the only link format
// (app/(public)/r/[slug]/page.tsx). `code` is AffiliateLink.slug, a
// short code from lib/affiliate-link-code.ts. Kept separate from that
// file so client components can import it without pulling in
// node:crypto.
export function affiliateLinkPath(code: string) {
  return `/r/${code}`;
}
