"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copyText } from "@/lib/clipboard";

// Builds the absolute URL client-side from window.location.origin
// rather than hardcoding a base URL, so it's correct in dev, any
// deployment, and any custom domain without an env var to keep in
// sync.
export function CopyButton({
  path,
  className,
}: {
  path: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    // Shared fallback for plain-http pages (lib/clipboard.ts). If copying
    // fails, leave the label alone so it doesn't lie.
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className={cn("rounded-pill", className)}
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
