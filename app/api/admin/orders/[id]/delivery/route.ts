import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { updateDeliveryStatusSchema } from "@/lib/validations/order-status";
import { maybeCreateCommission, orderHasCommission } from "@/lib/commission";

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

  const parsed = updateDeliveryStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return apiError("Order not found", 404);
  }

  if (await orderHasCommission(id)) {
    return apiError(
      "Delivery status is locked once a commission exists for this order",
      409,
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { deliveryStatus: parsed.data.status },
  });

  await maybeCreateCommission(id);

  return apiSuccess(updated);
}
