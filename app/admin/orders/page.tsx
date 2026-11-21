import { prisma } from "@/lib/prisma";
import { OrdersClient, type OrderRow, type OrderStat } from "./orders-client";
import { orderTotalBirr } from "@/lib/discount";
import { requireAdminPage } from "@/lib/auth-helpers";

const DAY_MS = 24 * 60 * 60 * 1000;
const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000;

// Admin orders list (design: user's reference, 2026-11-12). The server
// loads every order once (MVP volumes) and prepares the four statistic
// cards; filtering/sorting/paging/selection happen client-side.
export default async function AdminOrdersPage() {
  await requireAdminPage();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      buyerName: true,
      buyerPhone: true,
      buyerCity: true,
      buyerAddress: true,
      quantity: true,
      discountBirr: true,
      color: true,
      size: true,
      deliveryStatus: true,
      fulfillmentStatus: true,
      cashReconciledAt: true,
      createdAt: true,
      product: { select: { name: true, priceBirr: true, imageUrls: true } },
      creator: { select: { email: true, name: true, creatorDisplayName: true } },
      commission: { select: { status: true, amountBirr: true } },
    },
  });

  const rows: OrderRow[] = orders.map((order) => ({
    id: order.id,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    buyerCity: order.buyerCity,
    buyerAddress: order.buyerAddress,
    quantity: order.quantity,
    variant: [order.color, order.size].filter(Boolean).join(" / "),
    deliveryStatus: order.deliveryStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paid: Boolean(order.cashReconciledAt),
    createdAt: order.createdAt.toISOString(),
    productName: order.product.name,
    productImage: order.product.imageUrls[0] ?? null,
    totalBirr: orderTotalBirr({
      priceBirr: order.product.priceBirr,
      quantity: order.quantity,
      discountBirr: order.discountBirr,
    }),
    creatorName:
      order.creator.creatorDisplayName || order.creator.name || order.creator.email,
    commission: order.commission,
  }));

  // --- Statistics: this calendar month vs last (Addis Ababa time), plus a
  // daily series for the last 30 days drawn as a small trend line.
  const now = new Date();
  const local = new Date(now.getTime() + ADDIS_OFFSET_MS);
  const monthStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - ADDIS_OFFSET_MS;
  const lastMonthStart =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - 1, 1) - ADDIS_OFFSET_MS;

  function stat(
    label: string,
    match: (order: (typeof orders)[number]) => boolean,
    goodWhenUp: boolean,
  ): OrderStat {
    const matching = orders.filter(match);
    const thisMonth = matching.filter((o) => o.createdAt.getTime() >= monthStart).length;
    const lastMonth = matching.filter((o) => {
      const t = o.createdAt.getTime();
      return t >= lastMonthStart && t < monthStart;
    }).length;
    const series = Array.from({ length: 30 }, (_, i) => {
      const dayEnd = now.getTime() - (29 - i) * DAY_MS;
      const dayStart = dayEnd - DAY_MS;
      return matching.filter((o) => {
        const t = o.createdAt.getTime();
        return t > dayStart && t <= dayEnd;
      }).length;
    });
    const changePct =
      lastMonth === 0 ? (thisMonth === 0 ? 0 : null) : Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10;
    return { label, value: matching.length, changePct, goodWhenUp, series };
  }

  const stats: OrderStat[] = [
    stat("Total Orders", () => true, true),
    stat("Cancelled Orders", (o) => o.deliveryStatus === "CANCELLED", false),
    stat("Pending Orders", (o) => o.deliveryStatus === "PLACED", true),
    stat("Returned Orders", (o) => o.deliveryStatus === "RETURNED", false),
  ];

  return <OrdersClient orders={rows} stats={stats} loadedAt={now.toISOString()} />;
}
