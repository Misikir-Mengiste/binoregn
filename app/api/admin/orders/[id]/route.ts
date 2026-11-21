import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { updateOrderSchema } from "@/lib/validations/order";

// Admin edits an order's details (order detail page). Rules:
// - buyer name/phone/city/address/notes can always be corrected;
// - quantity/colour/size only while the order is still PLACED — after
//   delivery the stock was already deducted and the commission created
//   from these values, and cancelled/returned orders are closed;
// - colour/size must be one of the product's own options;
// - product, creator and affiliate link are never editable (attribution
//   is immutable — architecture.md invariant 5).
// Status changes stay on their own routes (fulfillment, delivery,
// cash-reconciled) so commission logic keeps a single path.
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

  const parsed = updateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const data = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      deliveryStatus: true,
      quantity: true,
      color: true,
      size: true,
      product: { select: { colors: true, sizes: true } },
    },
  });
  if (!order) {
    return apiError("Order not found", 404);
  }

  const changesItem =
    (data.quantity !== undefined && data.quantity !== order.quantity) ||
    (data.color !== undefined && (data.color || null) !== order.color) ||
    (data.size !== undefined && (data.size || null) !== order.size);
  if (changesItem && order.deliveryStatus !== "PLACED") {
    return apiError(
      "Quantity, colour and size can only be changed while the order is pending",
      409,
    );
  }

  const { colors, sizes } = order.product;
  if (data.color && !colors.includes(data.color)) {
    return apiError("Pick one of the product's colours", 400);
  }
  if (data.size && !sizes.includes(data.size)) {
    return apiError("Pick one of the product's sizes", 400);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      ...data,
      buyerNotes: data.buyerNotes === undefined ? undefined : data.buyerNotes || null,
      color: data.color === undefined ? undefined : data.color || null,
      size: data.size === undefined ? undefined : data.size || null,
    },
    select: { id: true },
  });

  return apiSuccess(updated);
}

// Soft delete — see lib/prisma.ts. Order is a financial/audit record
// (architecture.md invariant 4: status changes only through explicit
// admin actions) and may already have a Commission tied to it via a
// required FK, so the row is hidden from lists rather than dropped.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return apiError("Order not found", 404);
  }

  await prisma.order.delete({ where: { id } });

  return apiSuccess({ id });
}
