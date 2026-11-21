"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Copy, Share2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { affiliateLinkPath } from "@/lib/affiliate-link-path";
import type { PromoteState } from "@/lib/promotion";
import { copyText } from "@/lib/clipboard";

// The creator's single action on a product page (progress-tracker
// 2026-11-11): Request to Promote → Waiting for Approval → Copy Link +
// Share, or Not Approved / Full. State is computed server-side by
// lib/promotion.ts's promoteState; this only renders it and submits.
export function PromoteButton({
  productId,
  productName,
  state,
}: {
  productId: string;
  productName: string;
  state: PromoteState;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function requestToPromote() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/creator/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not send your request");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const base = "h-12 w-full rounded-pill text-sm font-semibold";

  if (state.kind === "APPROVED") {
    const path = affiliateLinkPath(state.linkSlug);

    async function copy() {
      const url = `${window.location.origin}${path}`;
      // lib/clipboard.ts handles plain-http pages and iOS; the label only
      // changes when the copy really happened.
      if (await copyText(url)) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }

    async function share() {
      const url = `${window.location.origin}${path}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: productName, url });
        } catch {
          // Dismissing the share sheet isn't an error worth showing.
        }
        return;
      }
      await copy();
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-3">
          <Button className={base} onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
          <Button variant="outline" className={base} onClick={share}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
        <p className="text-center text-xs text-ink-400 hidden">
          Your link: {path}
        </p>
      </div>
    );
  }

  if (state.kind === "PENDING") {
    return (
      <Button variant="outline" className={base} disabled>
        <Clock className="h-4 w-4" />
        Waiting for Approval
      </Button>
    );
  }

  if (state.kind === "REJECTED") {
    const againAt = state.requestAgainAt
      ? new Date(state.requestAgainAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" className={base} disabled>
          <XCircle className="h-4 w-4" />
          Not Approved
        </Button>
        {againAt ? (
          <p className="text-center text-xs text-ink-400">
            You can request this product again on {againAt}.
          </p>
        ) : null}
      </div>
    );
  }

  if (state.kind === "FULL") {
    return (
      <Button variant="outline" className={base} disabled>
        Full
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className={base} disabled={busy} onClick={requestToPromote}>
        {busy ? "Sending request…" : "Request to Promote"}
      </Button>
      {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
