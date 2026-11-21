"use client";

import { useState } from "react";
import { Check, Copy, Tag } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

// The product's creator discount code (lib/discount.ts), shown to
// creators approved for this product so they can share it with their
// followers. Buyers never see the code on the product page.
export function DiscountCode({
  code,
  amountBirr,
}: {
  code: string;
  amountBirr: number;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2 rounded-[14px] border border-dashed border-mint-500/60 bg-mint-100/50 p-3">
      <p className="flex items-center gap-2 text-xs font-medium text-ink-600">
        <Tag className="h-3.5 w-3.5 text-mint-500" />
        Discount code for your followers — saves them{" "}
        {amountBirr.toLocaleString("en-US")} ETB
      </p>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-[10px] bg-white px-3 py-2 font-mono text-base font-bold tracking-wider text-foreground">
          {code}
        </span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-sm font-semibold transition-colors",
            copied
              ? "bg-mint-500 text-white"
              : "bg-teal-600 text-white hover:bg-teal-700",
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-[11px] text-ink-400">
        You still earn your full commission on discounted orders.
      </p>
    </div>
  );
}
