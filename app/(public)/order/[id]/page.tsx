import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const STEPS = ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      buyerName: true,
      buyerAddress: true,
      buyerPhone: true,
      fulfillmentStatus: true,
      deliveryStatus: true,
      createdAt: true,
      product: { select: { name: true, imageUrls: true, priceBirr: true } },
      quantity: true,
    },
  });

  if (!order) {
    notFound();
  }

  const stepIndex = Math.max(0, STEPS.indexOf(order.fulfillmentStatus));

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-xl font-bold text-foreground">Order tracking</h1>
        <p className="mt-1 text-sm text-ink-600">
          Order #{order.id.slice(-8)}
        </p>

        <div className="mt-6 rounded-[12px] border border-border bg-card shadow-card">
          <div className="flex flex-col gap-5 px-6 py-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 overflow-hidden rounded-[12px] bg-surface-100">
                {order.product.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.product.imageUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-teal-100" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {order.product.name}
                </p>
                <p className="text-sm text-ink-600">
                  {order.product.priceBirr} Birr · Qty {order.quantity}
                </p>
              </div>
            </div>

            <div className="grid gap-4 text-xs text-ink-600 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-foreground">Delivery address</p>
                <p>{order.buyerName}</p>
                <p>{order.buyerAddress}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Contact</p>
                <p>{order.buyerPhone}</p>
                <p>Placed {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border px-6 py-4">
            <p className="text-xs text-ink-600">
              {order.deliveryStatus === "DELIVERED"
                ? "Delivered"
                : order.deliveryStatus === "CANCELLED"
                  ? "Cancelled"
                  : order.deliveryStatus === "RETURNED"
                    ? "Returned"
                    : "Preparing your order"}
            </p>
            <div className="mt-3 h-2 w-full rounded-pill bg-surface-100">
              <div
                className="h-full rounded-pill bg-teal-600"
                style={{
                  width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
              {STEPS.map((step) => (
                <span
                  key={step}
                  className={step === order.fulfillmentStatus ? "text-teal-600" : ""}
                >
                  {step === "PLACED"
                    ? "Order placed"
                    : step === "PROCESSING"
                      ? "Processing"
                      : step === "SHIPPED"
                        ? "Shipped"
                        : "Delivered"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
