"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// Builds the absolute URL client-side from window.location.origin
// rather than hardcoding a base URL, so it's correct in dev, any
// deployment, and any custom domain without an env var to keep in
// sync.
export function CopyButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-pill"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
