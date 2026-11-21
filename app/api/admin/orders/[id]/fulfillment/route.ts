import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { updateFulfillmentStatusSchema } from "@/lib/validations/order-status";
import { maybeCreateCommission, orderHasCommission } from "@/lib/commission";
import { afterOrderDelivered } from "@/lib/order-events";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updateFulfillmentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return apiError("Order not found", 404);
  }

  // A delivered order with a commission is final: moving it back to
  // processing/shipped would leave a paid-out-able commission on an
  // order that no longer reads as delivered.
  if (await orderHasCommission(id)) {
    return apiError(
      "This order is delivered and its commission is created — its status can't change",
      409,
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      fulfillmentStatus: parsed.data.status,
      deliveryStatus:
        parsed.data.status === "DELIVERED"
          ? "DELIVERED"
          : order.deliveryStatus,
    },
  });

  if (parsed.data.status === "DELIVERED") {
    if (await maybeCreateCommission(id)) await afterOrderDelivered(id);
  }

  return apiSuccess(updated);
}
