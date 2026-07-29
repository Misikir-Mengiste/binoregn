import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { maybeCreateCommission, orderHasCommission } from "@/lib/commission";

// Optional, independent action for an admin who wants to record cash
// reconciliation ahead of / separately from delivery. It's no longer a
// precondition for the commission — Delivered alone auto-sets
// cashReconciledAt if it isn't already set (lib/commission/index.ts) —
// so this route mainly exists for admins who reconcile cash earlier
// (e.g. on pickup) and want that timestamp to reflect the real time.
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return apiError("Order not found", 404);
  }

  if (await orderHasCommission(id)) {
    return apiError(
      "Cash reconciliation is locked once a commission exists for this order",
      409,
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { cashReconciledAt: new Date() },
  });

  await maybeCreateCommission(id);

  return apiSuccess(updated);
}
