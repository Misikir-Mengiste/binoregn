"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Admin Settings → the phone number buyers see (with a "Call now" button)
// on the order confirmation, between the order number and tracking link.
export function OrderPhoneSettings({
  initialPhone,
  initialVisible,
}: {
  initialPhone: string | null;
  initialVisible: boolean;
}) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [visible, setVisible] = useState(initialVisible);
  const [saved, setSaved] = useState({ phone: initialPhone ?? "", visible: initialVisible });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = phone.trim() !== saved.phone || visible !== saved.visible;

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderPhone: phone, showOrderPhone: visible }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Could not save");
      }
      const next = { phone: body.data.orderPhone ?? "", visible: body.data.showOrderPhone };
      setPhone(next.phone);
      setVisible(next.visible);
      setSaved(next);
      setMessage({ ok: true, text: "Saved" });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-teal-100 text-teal-700">
          <Phone className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-foreground">
            Phone on order confirmation
          </p>
          <p className="text-sm text-ink-600">
            Buyers see this number with a Call now button right after they
            place an order.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="order-phone" className="text-xs font-medium text-ink-600">
            Phone number
          </label>
          <Input
            id="order-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0911223344"
            className="h-10 rounded-[10px]"
          />
        </div>

        <label className="flex h-10 cursor-pointer items-center gap-3 select-none">
          <button
            type="button"
            role="switch"
            aria-checked={visible}
            aria-label="Show on order confirmation"
            onClick={() => setVisible((value) => !value)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              visible ? "bg-teal-600" : "bg-ink-400/40",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                visible && "translate-x-5",
              )}
            />
          </button>
          <span className="text-sm font-medium text-foreground">
            {visible ? "Visible" : "Hidden"}
          </span>
        </label>

        <Button
          className="h-10 rounded-[10px]"
          disabled={busy || !dirty}
          onClick={save}
        >
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>

      {message ? (
        <p className={cn("text-xs", message.ok ? "text-mint-500" : "text-destructive")}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
