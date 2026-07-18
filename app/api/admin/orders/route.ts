import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { OrderDeliveryStatus } from "@/generated/prisma/client";

const VALID_STATUSES = Object.values(OrderDeliveryStatus);

export async function GET(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const statusParam = request.nextUrl.searchParams.get("deliveryStatus");
  if (
    statusParam !== null &&
    !VALID_STATUSES.includes(statusParam as OrderDeliveryStatus)
  ) {
    return apiError("Invalid deliveryStatus filter", 400);
  }

  const orders = await prisma.order.findMany({
    where: statusParam
      ? { deliveryStatus: statusParam as OrderDeliveryStatus }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      buyerName: true,
      buyerPhone: true,
      buyerAddress: true,
      deliveryStatus: true,
      cashReconciledAt: true,
      createdAt: true,
      product: { select: { id: true, name: true, priceBirr: true } },
      creator: { select: { id: true, email: true, name: true } },
      commission: { select: { id: true, status: true, amountBirr: true } },
    },
  });

  return apiSuccess(orders);
}
