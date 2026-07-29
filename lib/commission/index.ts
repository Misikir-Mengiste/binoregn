import { prisma } from "@/lib/prisma";

// The single place that creates or transitions Commission records
// (architecture.md: "nothing outside this folder mutates
// commission state directly"). No HTTP concerns here — route
// handlers translate thrown errors into responses.

// Idempotent: safe to call after every delivery-status or
// cash-reconciliation update, regardless of whether the order is
// actually eligible yet. Once the order is Delivered and has no
// Commission yet, this both decrements the product's stock and
// creates the Commission (amount snapshotted from the product) —
// the two are bundled here because they're gated by the exact same
// one-time "just became Delivered" event.
//
// Delivered is the single trigger (decided 2026-07-28, superseding
// the earlier Delivered+cash-reconciled two-step trigger). Cash is
// now treated as fully collected the moment admin confirms delivery
// — cashReconciledAt is auto-set here if an admin hadn't already set
// it via the separate "Mark cash reconciled" action. That action still
// exists for admins who want to record reconciliation earlier/independently,
// it's just no longer a precondition for the commission to be created.
//
// Commission is created straight into PAID (decided 2026-07-29,
// superseding the earlier Delivered→Pending→(admin) Paid flow) —
// admin explicitly asked for delivery to auto-pay the creator rather
// than leaving a manual "Mark Paid" step. This is a UI-level
// simplification, not a real payment gateway: no money actually
// moves through the app (see architecture.md — COD, no online
// payments), so this now records the admin's payout as already
// settled at the moment of delivery. `markCommissionPaid` /
// PATCH /api/admin/commissions/[id]/pay are kept only to let an
// admin resolve any pre-existing PENDING rows from before this
// change; no new commission will ever need them.
export async function maybeCreateCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { commission: true, product: true },
  });
  if (!order) return;
  if (order.commission) return;
  if (order.deliveryStatus !== "DELIVERED") return;

  if (!order.cashReconciledAt) {
    await prisma.order.update({
      where: { id: orderId },
      data: { cashReconciledAt: new Date() },
    });
  }

  // Stock leaves inventory here, at Delivered, not at checkout — a
  // placed order can still be cancelled/returned before delivery. Runs
  // exactly once per order: this whole function body only executes on
  // the first Delivered transition, since the commission created below
  // is what permanently locks the order from being re-marked Delivered
  // (see orderHasCommission in the calling routes). Floored at 0 rather
  // than allowed negative — the "unpublish when out of stock" behavior
  // (app/creator/products, the public storefront) reads `stock > 0`
  // directly, not a separate flag, so this is the only place stock is
  // ever decremented.
  await prisma.product.update({
    where: { id: order.productId },
    data: { stock: Math.max(order.product.stock - order.quantity, 0) },
  });

  await prisma.commission.create({
    data: {
      orderId: order.id,
      creatorId: order.creatorId,
      amountBirr: order.product.commissionBirr,
      status: "PAID",
      paidAt: new Date(),
    },
  });
}

// Once a Commission exists for an order, its delivery status and
// cash-reconciliation are locked — architecture.md treats the
// commission lifecycle as forward-only, so the facts that produced
// a commission shouldn't be retroactively edited afterward
// (doc/backend-api-plan.md Open Question 3). Callers use this to
// reject delivery/cash-reconciled updates once it returns true.
export async function orderHasCommission(orderId: string) {
  const commission = await prisma.commission.findUnique({
    where: { orderId },
    select: { id: true },
  });
  return commission !== null;
}

export async function markCommissionPaid(commissionId: string) {
  const commission = await prisma.commission.findUnique({
    where: { id: commissionId },
  });
  if (!commission) {
    throw new Error("Commission not found");
  }
  if (commission.status !== "PENDING") {
    throw new Error("Commission is not PENDING");
  }
  return prisma.commission.update({
    where: { id: commissionId },
    data: { status: "PAID", paidAt: new Date() },
  });
}
