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
// Commission is created PENDING (decided 2026-11-11, reversing the
// 2026-07-29 auto-PAID rule). It becomes PAID only through a Friday
// payout (./payouts.ts), which covers PENDING commissions created by
// Thursday 11:59 PM once a creator's total reaches the minimum.
// Returns the new commission, or null if none was created.
export async function maybeCreateCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { commission: true, product: true },
  });
  if (!order) return null;
  if (order.commission) return null;
  if (order.deliveryStatus !== "DELIVERED") return null;

  try {
    // One transaction: the commission insert comes first and
    // Commission.orderId is unique, so if two "Delivered" requests race
    // (double click, bulk update) the second one fails here and rolls
    // back — stock is deducted and the commission created exactly once.
    return await prisma.$transaction(async (tx) => {
      const commission = await tx.commission.create({
        data: {
          orderId: order.id,
          creatorId: order.creatorId,
          amountBirr: order.product.commissionBirr,
          status: "PENDING",
        },
      });

      if (!order.cashReconciledAt) {
        await tx.order.update({
          where: { id: orderId },
          data: { cashReconciledAt: new Date() },
        });
      }

      // Stock leaves inventory here, at Delivered, not at checkout — a
      // placed order can still be cancelled/returned before delivery.
      // Atomic decrement (two orders of the same product delivered at
      // once both count), then floored at 0 rather than negative — the
      // "unpublish when out of stock" behavior (app/creator/products, the
      // public storefront) reads `stock > 0` directly, so this is the
      // only place stock is ever decremented.
      const product = await tx.product.update({
        where: { id: order.productId },
        data: { stock: { decrement: order.quantity } },
        select: { stock: true },
      });
      if (product.stock < 0) {
        await tx.product.update({
          where: { id: order.productId },
          data: { stock: 0 },
        });
      }

      return commission;
    });
  } catch (error) {
    // P2002 = unique violation: another request created it first.
    if ((error as { code?: string }).code === "P2002") return null;
    throw error;
  }
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

