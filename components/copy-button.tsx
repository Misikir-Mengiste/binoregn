"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    // navigator.clipboard is only available in secure contexts
    // (https/localhost). On plain-http deployments it's undefined, so
    // fall back to a hidden textarea + execCommand so copy still works.
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort: leave state unchanged so the label doesn't lie.
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
