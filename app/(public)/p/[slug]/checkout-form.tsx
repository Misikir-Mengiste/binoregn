"use client";

import { useState, type SubmitEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CheckoutForm({
  affiliateLinkSlug,
}: {
  affiliateLinkSlug: string;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateLinkSlug,
          buyerName,
          buyerPhone,
          buyerAddress,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not place the order");
      }
      const body = await response.json();
      setOrderId(body.data.id as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (orderId) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-mint-500" />
        <p className="text-[15px] font-bold text-foreground">Order placed</p>
        <p className="text-sm text-ink-600">
          We&apos;ll contact you to confirm delivery. Pay cash when your order
          arrives.
        </p>
        <p className="text-xs text-ink-400">Order #{orderId.slice(-8)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyerName">Full name</Label>
        <Input
          id="buyerName"
          required
          className="rounded-[8px]"
          value={buyerName}
          onChange={(event) => setBuyerName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyerPhone">Phone number</Label>
        <Input
          id="buyerPhone"
          type="tel"
          required
          className="rounded-[8px]"
          value={buyerPhone}
          onChange={(event) => setBuyerPhone(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="buyerAddress">Delivery address</Label>
        <Input
          id="buyerAddress"
          required
          className="rounded-[8px]"
          value={buyerAddress}
          onChange={(event) => setBuyerAddress(event.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={submitting} className="mt-1">
        {submitting ? "Placing order…" : "Place order — pay on delivery"}
      </Button>
    </form>
  );
}
