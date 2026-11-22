"use client";

import { useState, type ReactNode, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Lock,
  Minus,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { orderNumber } from "@/lib/order-number";
import { affiliateLinkPath } from "@/lib/affiliate-link-path";
import { ETHIOPIAN_CITIES } from "@/lib/ethiopian-cities";
import { orderStage, Pill, STAGE_BADGE } from "../orders-client";

type OrderDetail = {
  id: string;
  buyerName: string;
  buyerPhone: string;
  buyerCity: string | null;
  buyerAddress: string;
  buyerNotes: string | null;
  buyerEmail: string | null;
  quantity: number;
  discountBirr: number;
  discountCode: string | null;
  color: string | null;
  size: string | null;
  deliveryStatus: string;
  fulfillmentStatus: string;
  cashReconciledAt: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    priceBirr: number;
    commissionBirr: number;
    imageUrls: string[];
    colors: string[];
    sizes: string[];
    stock: number;
  };
  affiliateLink: { slug: string };
  creator: {
    id: string;
    email: string;
    name: string | null;
    creatorDisplayName: string | null;
    creatorUsername: string | null;
    creatorPhone: string | null;
  };
  commission: { status: string; amountBirr: number; createdAt: string; paidAt: string | null } | null;
};

const STEPS = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

function when(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Addis_Ababa",
  });
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const field =
  "h-11 w-full rounded-[10px] border border-border bg-white px-3 text-sm text-foreground outline-none transition-shadow focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-surface-100 disabled:text-ink-400";

export function OrderDetailClient({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const stage = orderStage(order);
  const closed = stage === "CANCELLED" || stage === "RETURNED";
  const locked = order.commission !== null; // delivered → commission exists
  const itemEditable = order.deliveryStatus === "PLACED";

  const initial = {
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    buyerCity: order.buyerCity ?? "",
    buyerAddress: order.buyerAddress,
    buyerNotes: order.buyerNotes ?? "",
    quantity: order.quantity,
    color: order.color ?? "",
    size: order.size ?? "",
  };
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function call(label: string, url: string, init: RequestInit) {
    setBusy(label);
    setMessage(null);
    try {
      const response = await fetch(url, init);
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message ?? "Something went wrong");
      setMessage({ ok: true, text: label });
      router.refresh();
      return true;
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      buyerName: values.buyerName,
      buyerPhone: values.buyerPhone,
      buyerCity: values.buyerCity,
      buyerAddress: values.buyerAddress,
      buyerNotes: values.buyerNotes.trim() || null,
    };
    if (itemEditable) {
      payload.quantity = values.quantity;
      if (order.product.colors.length > 0) payload.color = values.color || null;
      if (order.product.sizes.length > 0) payload.size = values.size || null;
    }
    await call("Order details saved.", `/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
  }

  function setStep(step: (typeof STEPS)[number]) {
    if (
      step === "DELIVERED" &&
      !window.confirm("Mark this order delivered? This creates the creator's commission and locks the order.")
    )
      return;
    call(`Marked ${STAGE_BADGE[step].label.toLowerCase()}.`, `/api/admin/orders/${order.id}/fulfillment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: step }),
    });
  }

  function close(status: "CANCELLED" | "RETURNED") {
    const word = status === "CANCELLED" ? "Cancel" : "Mark as returned";
    if (!window.confirm(`${word} this order? No commission is created for it.`)) return;
    call(status === "CANCELLED" ? "Order cancelled." : "Order marked returned.", `/api/admin/orders/${order.id}/delivery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function remove() {
    if (!window.confirm(`Delete order #${orderNumber(order.id)}? It'll be hidden from all lists.`)) return;
    const ok = await call("Order deleted.", `/api/admin/orders/${order.id}`, { method: "DELETE" });
    if (ok) router.push("/admin/orders");
  }

  const stepIndex = STEPS.indexOf((stage === "DELIVERED" ? "DELIVERED" : order.fulfillmentStatus) as (typeof STEPS)[number]);
  const badge = STAGE_BADGE[stage];
  // Creator discount is a fixed amount per order (lib/discount.ts).
  const total = Math.max(0, order.product.priceBirr * values.quantity - order.discountBirr);
  const creatorName = order.creator.creatorDisplayName || order.creator.name || order.creator.email;

  const timeline = [
    { label: "Order placed", at: order.createdAt },
    { label: "Payment received", at: order.cashReconciledAt },
    { label: "Delivered · commission created", at: order.commission?.createdAt ?? null },
    { label: "Commission paid to creator", at: order.commission?.paidAt ?? null },
  ];

  const actionBtn =
    "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-100 disabled:opacity-50";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link href="/admin/orders" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold text-foreground sm:text-[26px]">Order #{orderNumber(order.id)}</h1>
              <Pill className={badge.className} dot={badge.dot}>{badge.label}</Pill>
              {!closed ? (
                order.cashReconciledAt ? (
                  <Pill className="bg-mint-100 text-mint-500" dot="bg-mint-500">Payment received</Pill>
                ) : (
                  <Pill className="bg-peach-100 text-peach-700" dot="bg-peach-700">Payment pending</Pill>
                )
              ) : null}
            </div>
            <p className="text-sm text-ink-400">Placed {when(order.createdAt)} · last updated {when(order.updatedAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/orders/${order.id}/invoice`} className={actionBtn}>
              <FileText className="h-4 w-4" /> Invoice
            </Link>
            <button type="button" onClick={remove} disabled={busy !== null} className={cn(actionBtn, "text-coral-500")}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
        {message ? (
          <p className={cn("rounded-[10px] px-3 py-2 text-sm", message.ok ? "bg-mint-100 text-mint-500" : "bg-coral-100 text-coral-500")}>
            {message.text}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <Card
            title="Item"
            action={
              <Link
                href={affiliateLinkPath(order.affiliateLink.slug)}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700"
              >
                Product page <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <div className="flex gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[12px] border border-border bg-surface-100">
                {order.product.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.product.imageUrls[0]} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{order.product.name}</p>
                {[values.color, values.size].filter(Boolean).length > 0 ? (
                  <p className="text-sm text-ink-600">{[values.color, values.size].filter(Boolean).join(" / ")}</p>
                ) : null}
                <p className="mt-1 text-sm text-ink-600">
                  {order.product.priceBirr.toLocaleString("en-US")} ETB × {values.quantity}
                </p>
                {order.discountBirr > 0 ? (
                  <p className="mt-0.5 text-sm font-medium text-mint-500">
                    Discount{order.discountCode ? ` (${order.discountCode})` : ""} −{order.discountBirr.toLocaleString("en-US")} ETB
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 text-lg font-semibold text-foreground">{total.toLocaleString("en-US")} ETB</p>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-[12px] bg-surface-100 p-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-ink-400">Order total</dt>
                <dd className="font-semibold text-foreground">{total.toLocaleString("en-US")} ETB</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Creator commission</dt>
                <dd className="font-semibold text-foreground">
                  {(order.commission?.amountBirr ?? order.product.commissionBirr * values.quantity).toLocaleString("en-US")} ETB
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-400">Stock left</dt>
                <dd className="font-semibold text-foreground">{order.product.stock.toLocaleString("en-US")}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Customer & delivery details">
            <form onSubmit={save} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Full name
                  <input required value={values.buyerName} onChange={(e) => set("buyerName", e.target.value)} className={field} />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Phone
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="\d{10}"
                    minLength={10}
                    maxLength={10}
                    title="10 digits, numbers only"
                    value={values.buyerPhone}
                    onChange={(e) => set("buyerPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={field}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  City
                  <select required value={values.buyerCity} onChange={(e) => set("buyerCity", e.target.value)} className={field}>
                    <option value="" disabled>Select city</option>
                    {/* Keep an older free-text city selectable even if it's not in the list. */}
                    {values.buyerCity && !ETHIOPIAN_CITIES.includes(values.buyerCity as (typeof ETHIOPIAN_CITIES)[number]) ? (
                      <option value={values.buyerCity}>{values.buyerCity}</option>
                    ) : null}
                    {ETHIOPIAN_CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Address
                  <input required value={values.buyerAddress} onChange={(e) => set("buyerAddress", e.target.value)} className={field} />
                </label>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                Notes
                <textarea
                  rows={3}
                  value={values.buyerNotes}
                  onChange={(e) => set("buyerNotes", e.target.value)}
                  placeholder="Delivery instructions, landmarks…"
                  className={cn(field, "h-auto py-2.5")}
                />
              </label>

              <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                  Quantity
                  <div className="inline-flex h-11 w-fit items-center rounded-[10px] border border-border bg-white">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={!itemEditable || values.quantity <= 1}
                      onClick={() => set("quantity", values.quantity - 1)}
                      className="flex h-full w-10 items-center justify-center text-ink-600 disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-8 text-center font-semibold">{values.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={!itemEditable || values.quantity >= 99}
                      onClick={() => set("quantity", values.quantity + 1)}
                      className="flex h-full w-10 items-center justify-center text-ink-600 disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {order.product.colors.length > 0 ? (
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Colour
                    <select disabled={!itemEditable} value={values.color} onChange={(e) => set("color", e.target.value)} className={field}>
                      <option value="">—</option>
                      {order.product.colors.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {order.product.sizes.length > 0 ? (
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Size
                    <select disabled={!itemEditable} value={values.size} onChange={(e) => set("size", e.target.value)} className={field}>
                      <option value="">—</option>
                      {order.product.sizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              {!itemEditable ? (
                <p className="inline-flex items-center gap-1.5 text-xs text-ink-400">
                  <Lock className="h-3.5 w-3.5" /> Quantity, colour and size can only change while the order is pending.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2">
                {dirty ? (
                  <button type="button" className={actionBtn} onClick={() => setValues(initial)}>
                    Discard changes
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={!dirty || saving}
                  className="h-10 rounded-[10px] bg-teal-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <Card title="Order status">
            {closed ? (
              <p className="text-sm text-ink-600">
                This order was <span className="font-semibold text-coral-500">{badge.label.toLowerCase()}</span>. No commission is created for it.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {STEPS.map((step, index) => {
                  const done = index <= stepIndex;
                  const current = index === stepIndex;
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          done ? "border-teal-600 bg-teal-600 text-white" : "border-border bg-card text-ink-400",
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className={cn("flex-1 text-sm", current ? "font-semibold text-foreground" : done ? "text-ink-600" : "text-ink-400")}>
                        {STAGE_BADGE[step].label}
                      </span>
                      {!locked && !current ? (
                        <button
                          type="button"
                          disabled={busy !== null}
                          onClick={() => setStep(step)}
                          className="rounded-[8px] border border-border px-2.5 py-1 text-xs font-medium text-ink-600 hover:bg-surface-100 disabled:opacity-50"
                        >
                          {index > stepIndex ? "Mark" : "Back to"}
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
            {locked ? (
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-400">
                <Lock className="h-3.5 w-3.5" /> Delivered — status is locked because the commission was created.
              </p>
            ) : !closed ? (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
                <button type="button" disabled={busy !== null} onClick={() => close("CANCELLED")} className={cn(actionBtn, "text-coral-500")}>
                  Cancel order
                </button>
                <button type="button" disabled={busy !== null} onClick={() => close("RETURNED")} className={actionBtn}>
                  Mark returned
                </button>
              </div>
            ) : null}
          </Card>

          {!closed ? (
            <Card title="Payment">
              {order.cashReconciledAt ? (
                <p className="flex items-start gap-2 text-sm text-ink-600">
                  <Wallet className="mt-0.5 h-4 w-4 text-mint-500" />
                  <span>
                    Payment received on <span className="font-medium text-foreground">{when(order.cashReconciledAt)}</span>.
                  </span>
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-ink-600">
                    Not recorded yet. Marking the order delivered records it automatically.
                  </p>
                  <button
                    type="button"
                    disabled={busy !== null || locked}
                    onClick={() =>
                      call("Payment recorded.", `/api/admin/orders/${order.id}/cash-reconciled`, { method: "PATCH" })
                    }
                    className={actionBtn}
                  >
                    <Wallet className="h-4 w-4" /> Mark payment received
                  </button>
                </div>
              )}
            </Card>
          ) : null}

          <Card title="Creator">
            <div className="flex flex-col gap-1 text-sm">
              <Link href={`/admin/creators/${order.creator.id}`} className="font-semibold text-foreground hover:text-teal-700">
                {creatorName}
              </Link>
              {order.creator.creatorUsername ? <p className="text-ink-600">@{order.creator.creatorUsername}</p> : null}
              <p className="text-ink-600">{order.creator.email}</p>
              {order.creator.creatorPhone ? <p className="text-ink-600">{order.creator.creatorPhone}</p> : null}
              <p className="mt-2 text-xs text-ink-400">
                Link {affiliateLinkPath(order.affiliateLink.slug)} · attribution can&apos;t be changed
              </p>
            </div>
            <div className="mt-4 rounded-[12px] bg-surface-100 p-3 text-sm">
              {order.commission ? (
                <p className="text-ink-600">
                  Commission <span className="font-semibold text-foreground">{order.commission.amountBirr.toLocaleString("en-US")} ETB</span> ·{" "}
                  {order.commission.status === "PAID" ? "paid in a Friday payout" : "pending — paid on a Friday"}
                </p>
              ) : closed ? (
                <p className="text-ink-600">No commission for this order.</p>
              ) : (
                <p className="text-ink-600">
                  Earns <span className="font-semibold text-foreground">{(order.product.commissionBirr * values.quantity).toLocaleString("en-US")} ETB</span>{values.quantity > 1 ? ` (${order.product.commissionBirr.toLocaleString("en-US")} × ${values.quantity})` : ""} once delivered.
                </p>
              )}
            </div>
          </Card>

          <Card title="Timeline">
            <ol className="flex flex-col gap-3">
              {timeline.map((item) => (
                <li key={item.label} className="flex items-start gap-3 text-sm">
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.at ? "bg-teal-600" : "bg-border")} />
                  <div>
                    <p className={item.at ? "text-foreground" : "text-ink-400"}>{item.label}</p>
                    <p className="text-xs text-ink-400">{when(item.at) ?? "Not yet"}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
