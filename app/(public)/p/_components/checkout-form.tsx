"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ETHIOPIAN_CITIES } from "@/lib/ethiopian-cities";

export function CheckoutForm({
  affiliateLinkSlug,
  productName,
  priceBirr,
}: {
  affiliateLinkSlug: string;
  productName: string;
  priceBirr: number;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");
  const searchParams = useSearchParams();
  const initialQuantity = useMemo(() => {
    const raw = searchParams.get("qty");
    if (!raw) return 1;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return 1;
    return Math.min(99, Math.max(1, parsed));
  }, [searchParams]);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);

  const subtotal = useMemo(() => priceBirr * quantity, [priceBirr, quantity]);

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
          buyerCity,
          buyerEmail: buyerEmail.trim() || undefined,
          buyerNotes: buyerNotes.trim() || undefined,
          quantity,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not place the order");
      }
      const body = await response.json();
      setOrderId(body.data.id as string);
      if (!buyerEmail.trim()) {
        const base = window.location.origin;
        setTrackingUrl(body.data.trackingUrl ?? `${base}/order/${body.data.id}`);
      }
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
        {buyerEmail.trim() ? (
          <p className="text-xs text-ink-600">
            We emailed your tracking link to {buyerEmail}.
          </p>
        ) : trackingUrl ? (
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-xs text-ink-600">
              Copy this link to track your order:
            </p>
            <div className="flex items-center gap-2 rounded-[8px] border border-border bg-card px-3 py-2 text-xs text-ink-600">
              <span className="max-w-[220px] truncate">{trackingUrl}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-teal-600"
                onClick={() => navigator.clipboard.writeText(trackingUrl)}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-xs font-semibold text-ink-400">
        <span>STEP {step} OF 2</span>
        <span>{step === 1 ? "Order" : "Delivery"}</span>
      </div>
      <div className="h-2 w-full rounded-pill bg-surface-100">
        <div
          className="h-full rounded-pill bg-teal-600 transition-all"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      {step === 1 ? (
        <>
          <div className="rounded-[10px] border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Order info</h3>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{productName}</p>
                <p className="text-xs text-ink-600">{priceBirr} ETB</p>
              </div>
              <div className="flex items-center gap-2 rounded-[8px] border border-border px-2 py-1">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border border-border"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[24px] text-center text-sm font-semibold text-foreground">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border border-border"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Order summary</h3>
            <div className="mt-3 flex items-center justify-between text-sm text-ink-600">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{subtotal} ETB</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-ink-600">
              <span>Shipping</span>
              <span className="font-semibold text-foreground">Cash on delivery</span>
            </div>
            <div className="mt-3 border-t border-border pt-3 text-sm text-ink-600">
              <div className="flex items-center justify-between">
                <span>Order total</span>
                <span className="text-base font-semibold text-foreground">
                  {subtotal} ETB
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            className="mt-1"
            onClick={() => setStep(2)}
          >
            Continue to delivery
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4">
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
              <Label htmlFor="buyerCity">City</Label>
              <select
                id="buyerCity"
                required
                value={buyerCity}
                onChange={(event) => setBuyerCity(event.target.value)}
                className="h-10 rounded-[8px] border border-border bg-card px-3 text-sm text-foreground outline-none"
              >
                <option value="" disabled>
                  Select your city
                </option>
                {ETHIOPIAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="buyerEmail">Email (optional)</Label>
              <Input
                id="buyerEmail"
                type="email"
                className="rounded-[8px]"
                value={buyerEmail}
                onChange={(event) => setBuyerEmail(event.target.value)}
              />
              <p className="text-xs text-ink-400">
                We&apos;ll send a tracking link if you provide an email.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="buyerNotes">Notes (optional)</Label>
              <textarea
                id="buyerNotes"
                rows={3}
                value={buyerNotes}
                onChange={(event) => setBuyerNotes(event.target.value)}
                placeholder="Delivery instructions, landmarks, preferred time…"
                className="rounded-[8px] border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-ink-400"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Placing order…" : "Place order — pay on delivery"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
