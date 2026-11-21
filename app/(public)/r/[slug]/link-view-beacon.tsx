"use client";

import { useEffect, useRef } from "react";

// Reports one view of this affiliate link from the browser. The server
// decides whether it counts (once per visitor per 24h — see
// app/api/public/links/[slug]/view/route.ts). Renders nothing.
export function LinkViewBeacon({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch(`/api/public/links/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
