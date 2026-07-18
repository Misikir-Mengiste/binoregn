import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { maybeCreateCommission, orderHasCommission } from "@/lib/commission";

// Deliberately a separate action from PATCH .../delivery — the two
// are independent, separately-timestamped admin actions per
// architecture.md, not one combined step.
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
