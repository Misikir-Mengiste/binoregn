"use client";

import { useRef, useState, type ReactNode, type SubmitEvent } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Map as MapIcon,
  MapPin,
  MessageSquareText,
  Minus,
  Phone,
  Plus,
  Tag,
  UserRound,
  X,
} from "lucide-react";
import { ETHIOPIAN_CITIES } from "@/lib/ethiopian-cities";
import { orderNumber } from "@/lib/order-number";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

// Delivery notes shown above the button (user-supplied copy, 2026-11-11).
const DELIVERY_NOTES = [
  "We offer free delivery within Addis Ababa only.",
  "Your order will arrive within 3 hours if you place it during our working hours (2:00 AM – 11:00 AM LT).",
  "Pay only when you receive your order.",
  "We accept payments via Telebirr and CBE only.",
];

// One-step checkout (replaces the old 2-step flow). Used inside the
// product page modal (checkout-modal.tsx, with onClose) and on the
// fallback /r/[slug]/order page. Fields are unchanged: name, phone, city,
// address, notes, quantity (+ colour/size picked on the product page).
export function CheckoutForm({
  affiliateLinkSlug,
  productName,
  priceBirr,
  imageUrl,
  initialQuantity = 1,
  color,
  size,
  onQuantityChange,
  onClose,
  discountAvailableBirr = null,
}: {
  affiliateLinkSlug: string;
  productName: string;
  priceBirr: number;
  imageUrl?: string | null;
  initialQuantity?: number;
  color?: string;
  size?: string;
  onQuantityChange?: (quantity: number) => void;
  onClose?: () => void;
  /** Set when the product's creator discount is on (amount only — the
   *  code itself never reaches the browser). Shows the code field. */
  discountAvailableBirr?: number | null;
}) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerCity, setBuyerCity] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");
  const [quantity, setQuantityState] = useState(
    Math.min(99, Math.max(1, initialQuantity)),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Creator discount code (lib/discount.ts): checked with Apply, and again
  // by the order route when the order is placed.
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountBirr, setDiscountBirr] = useState(0);
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) {
      setCodeError("Enter the code you got from the creator.");
      return;
    }
    setCodeBusy(true);
    setCodeError(null);
    try {
      const response = await fetch(
        `/api/public/links/${encodeURIComponent(affiliateLinkSlug)}/discount`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not check the code");
      }
      setAppliedCode(code.toUpperCase());
      setDiscountBirr(body.data.discountBirr as number);
    } catch (err) {
      setCodeError(
        err instanceof Error ? err.message : "Could not check the code",
      );
    } finally {
      setCodeBusy(false);
    }
  }

  function removeCode() {
    setAppliedCode(null);
    setDiscountBirr(0);
    setCodeInput("");
    setCodeError(null);
  }

  function setQuantity(next: number) {
    const clamped = Math.min(99, Math.max(1, next));
    setQuantityState(clamped);
    onQuantityChange?.(clamped);
  }

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
          buyerNotes: buyerNotes.trim() || undefined,
          quantity,
          color,
          size,
          // A typed-but-not-applied code is still sent; the server checks it.
          discountCode: appliedCode ?? (codeInput.trim() || undefined),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Could not place the order");
      }
      const body = await response.json();
      setOrderId(body.data.id as string);
      setContactPhone((body.data.contactPhone as string | null) ?? null);
      // Confirmation is on-screen only (no email/SMS), so the tracking
      // link is always shown here. Built from the address the buyer is on
      // (not the server's Host header), so it's right behind a proxy/HTTPS.
      setTrackingUrl(`${window.location.origin}/order/${body.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const header = (title: string) => (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-surface-100"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );

  if (orderId) {
    return (
      <div className="flex flex-col gap-4">
        {header("Order placed")}
        <div className="flex flex-col items-center gap-2 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-100">
            <CheckCircle2 className="h-8 w-8 text-mint-500" />
          </span>
          <p className="text-base font-semibold text-foreground">
            Thank you! Your order is confirmed.
          </p>
          <p className="text-sm text-ink-600">
            We&apos;ll call you to confirm delivery. Pay when your order
            arrives.
          </p>
          <p className="mt-1 rounded-[10px] bg-surface-100 px-3 py-1.5 text-sm font-semibold text-foreground">
            Order number: #{orderNumber(orderId)}
          </p>
          <p className="text-xs text-ink-400">
            Save this number — quote it if you contact us about your order.
          </p>
        </div>
        {contactPhone ? (
          <div className="flex items-center gap-3 rounded-[12px] border border-border bg-white px-3 py-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <Phone className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-400">
                Questions about your order?
              </p>
              <p className="truncate text-sm font-semibold text-foreground">
                {contactPhone}
              </p>
            </div>
            <a
              href={`tel:${contactPhone.replace(/[\s-]/g, "")}`}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              <Phone className="h-4 w-4" />
              Call now
            </a>
          </div>
        ) : null}
        {trackingUrl ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-ink-600">
              Track your order with this link:
            </p>
            <div className="flex items-center gap-2 rounded-[10px] border border-border bg-white py-1.5 pr-1.5 pl-3 text-xs text-ink-600">
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener"
                className="min-w-0 flex-1 truncate underline-offset-2 hover:text-teal-700 hover:underline"
              >
                {trackingUrl}
              </a>
              <button
                type="button"
                aria-live="polite"
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1 rounded-[8px] px-2.5 font-semibold transition-colors",
                  copied === "copied"
                    ? "bg-mint-100 text-mint-500"
                    : copied === "failed"
                      ? "bg-coral-100 text-coral-500"
                      : "text-teal-700 hover:bg-teal-100",
                )}
                onClick={async () => {
                  const ok = await copyText(trackingUrl);
                  setCopied(ok ? "copied" : "failed");
                  if (copyTimer.current) clearTimeout(copyTimer.current);
                  copyTimer.current = setTimeout(() => setCopied("idle"), 2500);
                }}
              >
                {copied === "copied" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied === "copied"
                  ? "Copied"
                  : copied === "failed"
                    ? "Couldn't copy"
                    : "Copy"}
              </button>
            </div>
          </div>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-[12px] bg-teal-600 text-base font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Done
          </button>
        ) : null}
      </div>
    );
  }

  const variant = [color, size].filter(Boolean).join(" / ");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {header("Please fill in the form to order")}

      {/* Product row */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="relative shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-[12px] border border-border bg-surface-100">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-teal-600 px-1.5 text-xs font-semibold text-white ring-2 ring-white">
            {quantity}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-foreground">
            {productName}
          </p>
          {variant ? <p className="text-xs text-ink-600">{variant}</p> : null}
          <div className="mt-1.5 inline-flex h-8 items-center rounded-pill border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity(quantity - 1)}
              className="flex h-full w-8 items-center justify-center text-ink-600 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-6 text-center text-xs font-semibold text-foreground">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={quantity >= 99}
              onClick={() => setQuantity(quantity + 1)}
              className="flex h-full w-8 items-center justify-center text-ink-600 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="shrink-0 self-start pt-0.5 text-right whitespace-nowrap">
          {discountBirr > 0 ? (
            <p className="text-xs text-ink-400 line-through">
              {(priceBirr * quantity).toLocaleString("en-US")} ETB
            </p>
          ) : null}
          <p className="text-sm font-semibold text-foreground">
            {Math.max(0, priceBirr * quantity - discountBirr).toLocaleString(
              "en-US",
            )}{" "}
            ETB
          </p>
        </div>
      </div>

      {/* Creator discount code — first, right under the price it changes. */}
      {discountAvailableBirr ? (
        appliedCode ? (
          <div className="flex items-center gap-3 rounded-[12px] border border-mint-500/40 bg-mint-100/60 px-3 py-2.5">
            <Tag className="h-4 w-4 shrink-0 text-mint-500" />
            <p className="min-w-0 flex-1 text-sm text-foreground">
              <span className="font-semibold">{appliedCode}</span> applied ·{" "}
              <span className="font-semibold text-mint-500">
                you save {discountBirr.toLocaleString("en-US")} ETB
              </span>
            </p>
            <button
              type="button"
              onClick={removeCode}
              className="shrink-0 text-xs font-semibold text-ink-600 underline-offset-2 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <IconField
              id="discountCode"
              label="Discount code (optional)"
              icon={<Tag />}
            >
              <input
                id="discountCode"
                placeholder="Code from your creator"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                maxLength={20}
                value={codeInput}
                onChange={(event) => {
                  setCodeInput(
                    event.target.value.replace(/\s+/g, "").toUpperCase(),
                  );
                  setCodeError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void applyCode();
                  }
                }}
                className={cn(inputClass, "uppercase placeholder:normal-case")}
              />
              <button
                type="button"
                onClick={applyCode}
                disabled={codeBusy}
                className="mr-1.5 h-9 shrink-0 self-center rounded-[8px] bg-ink-900 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-ink-600 disabled:opacity-60"
              >
                {codeBusy ? "Checking…" : "Apply"}
              </button>
            </IconField>
            {codeError ? (
              <p className="text-xs font-medium text-coral-500">{codeError}</p>
            ) : null}
          </div>
        )
      ) : null}

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <IconField
          id="buyerName"
          label="Full Name"
          icon={<UserRound />}
          required
        >
          <input
            id="buyerName"
            required
            autoComplete="name"
            placeholder="Name"
            value={buyerName}
            onChange={(event) => setBuyerName(event.target.value)}
            className={inputClass}
          />
        </IconField>
        <IconField
          id="buyerPhone"
          label="Phone"
          icon={<Phone />}
          required
          hint={
            buyerPhone.length > 0 && buyerPhone.length < 10
              ? `${10 - buyerPhone.length} more digit${10 - buyerPhone.length === 1 ? "" : "s"}`
              : undefined
          }
        >
          <input
            id="buyerPhone"
            type="tel"
            required
            autoComplete="tel-national"
            inputMode="numeric"
            // Exactly 10 digits (e.g. 0912345678). Non-digits are dropped
            // as they're typed; the server enforces the same rule.
            pattern="\d{10}"
            minLength={10}
            maxLength={10}
            title="Enter a 10-digit phone number, numbers only (e.g. 0912345678)"
            placeholder="09XXXXXXXX"
            value={buyerPhone}
            onChange={(event) =>
              setBuyerPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className={inputClass}
          />
        </IconField>
        <IconField id="buyerCity" label="City" icon={<MapPin />} required>
          <select
            id="buyerCity"
            required
            value={buyerCity}
            onChange={(event) => setBuyerCity(event.target.value)}
            className={cn(
              inputClass,
              "appearance-none bg-transparent",
              !buyerCity && "text-ink-400",
            )}
          >
            <option value="" disabled>
              Select your city
            </option>
            {ETHIOPIAN_CITIES.map((city) => (
              <option key={city} value={city} className="text-foreground">
                {city}
              </option>
            ))}
          </select>
        </IconField>
        <IconField
          id="buyerAddress"
          label="Address"
          icon={<MapIcon />}
          required
        >
          <input
            id="buyerAddress"
            required
            autoComplete="street-address"
            placeholder="e.g. Megenagna, near the roundabout"
            value={buyerAddress}
            onChange={(event) => setBuyerAddress(event.target.value)}
            className={inputClass}
          />
        </IconField>
        <IconField
          id="buyerNotes"
          label="Notes (optional)"
          icon={<MessageSquareText />}
          top
        >
          <textarea
            id="buyerNotes"
            rows={2}
            placeholder="Delivery instructions, landmarks, preferred time…"
            value={buyerNotes}
            onChange={(event) => setBuyerNotes(event.target.value)}
            className={cn(inputClass, "h-auto min-h-12 resize-none py-3")}
          />
        </IconField>
      </div>

      {/* Delivery notes */}
      <ul className="flex list-disc flex-col gap-1.5 rounded-[12px] bg-teal-100/60 py-3 pr-3 pl-7 text-xs leading-relaxed text-ink-600 marker:text-teal-600">
        {DELIVERY_NOTES.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="h-12 rounded-[12px] bg-teal-600 text-base font-semibold text-white shadow-[0_8px_20px_-8px_rgba(12,181,135,0.7)] transition-colors hover:bg-teal-700 disabled:opacity-70"
      >
        {submitting ? "Placing your order…" : "Confirm to Delivery"}
      </button>
    </form>
  );
}

const inputClass =
  "h-12 w-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-foreground outline-none placeholder:text-ink-400";

// Label + bordered field with a shaded icon box on the left (reference
// design). Focus ring in the brand green.
function IconField({
  id,
  label,
  icon,
  required,
  top,
  hint,
  children,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  required?: boolean;
  top?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required ? <span className="text-coral-500">*</span> : null}
      </label>
      <div className="flex overflow-hidden rounded-[12px] border border-border bg-white transition-shadow focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/20">
        <span
          className={cn(
            "flex w-12 shrink-0 justify-center border-r border-border bg-surface-100 text-ink-600 [&_svg]:h-5 [&_svg]:w-5",
            top ? "items-start pt-3.5" : "items-center",
          )}
          aria-hidden
        >
          {icon}
        </span>
        {children}
      </div>
      {hint ? <p className="text-xs text-ink-400">{hint}</p> : null}
    </div>
  );
}
