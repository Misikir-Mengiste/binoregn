import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetailClient } from "./order-detail-client";
import { requireAdminPage } from "@/lib/auth-helpers";

// Full order view + editing for admin (opened by clicking a row on
// /admin/orders). Editing rules live in PATCH /api/admin/orders/[id];
// status changes go through the existing fulfillment / delivery /
// cash-reconciled routes so commission logic keeps one path.
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      buyerName: true,
      buyerPhone: true,
      buyerCity: true,
      buyerAddress: true,
      buyerNotes: true,
      buyerEmail: true,
      quantity: true,
      discountBirr: true,
      discountCode: true,
      color: true,
      size: true,
      deliveryStatus: true,
      fulfillmentStatus: true,
      cashReconciledAt: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          priceBirr: true,
          commissionBirr: true,
          imageUrls: true,
          colors: true,
          sizes: true,
          stock: true,
        },
      },
      affiliateLink: { select: { slug: true } },
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          creatorDisplayName: true,
          creatorUsername: true,
          creatorPhone: true,
        },
      },
      commission: {
        select: {
          status: true,
          amountBirr: true,
          createdAt: true,
          paidAt: true,
        },
      },
    },
  });
  if (!order) notFound();

  const iso = (date: Date | null | undefined) => (date ? date.toISOString() : null);

  return (
    <OrderDetailClient
      order={{
        ...order,
        cashReconciledAt: iso(order.cashReconciledAt),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        commission: order.commission
          ? {
              ...order.commission,
              createdAt: order.commission.createdAt.toISOString(),
              paidAt: iso(order.commission.paidAt),
            }
          : null,
      }}
    />
  );
}
