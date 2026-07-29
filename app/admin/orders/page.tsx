import { ShoppingBag, Clock, CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { OrdersClient } from "./orders-client";

export default async function AdminOrdersPage() {
  const [orders, total, placed, delivered, cancelled] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        buyerName: true,
        buyerPhone: true,
        buyerAddress: true,
        buyerCity: true,
        buyerNotes: true,
        color: true,
        size: true,
        deliveryStatus: true,
        fulfillmentStatus: true,
        cashReconciledAt: true,
        createdAt: true,
        product: {
          select: { name: true, priceBirr: true, imageUrls: true },
        },
        creator: { select: { email: true, name: true } },
        commission: { select: { status: true, amountBirr: true } },
      },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { deliveryStatus: "PLACED" } }),
    prisma.order.count({ where: { deliveryStatus: "DELIVERED" } }),
    prisma.order.count({
      where: { deliveryStatus: { in: ["CANCELLED", "RETURNED"] } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders List"
        description="Here you can find all of your Orders."
        breadcrumbs={[{ label: "Orders List" }]}
        showMoreActions
      />
      <KpiStrip
        items={[
          {
            label: "Total Orders",
            value: total.toLocaleString(),
            icon: ShoppingBag,
            accent: "teal",
          },
          {
            label: "New Orders",
            value: placed.toLocaleString(),
            icon: Clock,
            accent: "orange",
          },
          {
            label: "Completed Orders",
            value: delivered.toLocaleString(),
            icon: CheckCircle2,
            accent: "mint",
          },
          {
            label: "Cancelled Orders",
            value: cancelled.toLocaleString(),
            icon: XCircle,
            accent: "coral",
          },
        ]}
      />
      <OrdersClient orders={orders} />
    </div>
  );
}
