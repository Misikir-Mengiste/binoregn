import { prisma } from "@/lib/prisma";

// The single place that creates or transitions Commission records
// (architecture.md: "nothing outside this folder mutates
// commission state directly"). No HTTP concerns here — route
// handlers translate thrown errors into responses.

// Idempotent: safe to call after every delivery-status or
// cash-reconciliation update, regardless of whether the order is
// actually eligible yet. Creates the Commission (status PENDING,
// amount snapshotted from the product) only once both conditions
// are true and no Commission already exists for this order.
export async function maybeCreateCommission(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { commission: true, product: true },
  });
  if (!order) return;
  if (order.commission) return;
  if (order.deliveryStatus !== "DELIVERED") return;
  if (!order.cashReconciledAt) return;

  await prisma.commission.create({
    data: {
      orderId: order.id,
      creatorId: order.creatorId,
      amountBirr: order.product.commissionBirr,
      status: "PENDING",
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
