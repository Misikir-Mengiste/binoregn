import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { BrandMark } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InvoiceActions } from "./invoice-actions";

export default async function CreatorOrderInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const creatorId = session!.user.id;
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, creatorId },
    select: {
      id: true,
      buyerName: true,
      buyerPhone: true,
      buyerAddress: true,
      buyerCity: true,
      buyerEmail: true,
      quantity: true,
      createdAt: true,
      deliveryStatus: true,
      fulfillmentStatus: true,
      product: {
        select: {
          name: true,
          priceBirr: true,
          imageUrls: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const subtotal = order.product.priceBirr * order.quantity;
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invoice"
        description={`Order #${order.id.slice(0, 10)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/creator/earnings"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "bg-card print:hidden",
              )}
            >
              Back to earnings
            </Link>
            <InvoiceActions />
          </div>
        }
      />

      <section className="rounded-[16px] border border-border bg-card p-6 shadow-card print:border-transparent print:shadow-none sm:p-8">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="h-11 w-11 text-base" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Binoregn
              </p>
              <p className="text-xs text-ink-400">Order invoice</p>
            </div>
          </div>
          <div className="text-sm text-ink-600">
            <p>
              <span className="font-semibold text-foreground">Invoice #</span>{" "}
              {order.id.slice(0, 10).toUpperCase()}
            </p>
            <p>
              <span className="font-semibold text-foreground">Order date</span>{" "}
              {formattedDate}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Status</span>{" "}
              <StatusBadge status={order.deliveryStatus} />
            </p>
          </div>
        </div>

        <div className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-ink-400">Billed to</p>
            <div className="mt-2 space-y-1 text-sm text-ink-600">
              <p className="font-semibold text-foreground">{order.buyerName}</p>
              <p>{order.buyerAddress}</p>
              {order.buyerCity ? <p>{order.buyerCity}</p> : null}
              <p>{order.buyerPhone}</p>
              {order.buyerEmail ? <p>{order.buyerEmail}</p> : null}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ink-400">
              Order details
            </p>
            <div className="mt-2 space-y-1 text-sm text-ink-600">
              <p>
                <span className="font-semibold text-foreground">Fulfillment</span>{" "}
                {order.fulfillmentStatus}
              </p>
              <p>
                <span className="font-semibold text-foreground">Quantity</span>{" "}
                {order.quantity}
              </p>
              <p>
                <span className="font-semibold text-foreground">Unit price</span>{" "}
                {order.product.priceBirr.toLocaleString()} ETB
              </p>
              <p>
                <span className="font-semibold text-foreground">Payment</span>{" "}
                Cash on delivery
              </p>
            </div>
          </div>
        </div>

        <div className="py-6">
          <div className="overflow-hidden rounded-[12px] border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-100 text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-4 py-4 text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-[8px] bg-surface-100">
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
                        <p className="text-xs text-ink-400">Affiliate order</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-ink-600">{order.quantity}</td>
                  <td className="px-4 py-4 text-right text-ink-600">
                    {order.product.priceBirr.toLocaleString()} ETB
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-foreground">
                    {subtotal.toLocaleString()} ETB
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-3 rounded-[12px] border border-border bg-surface-100 p-4 text-sm">
              <div className="flex items-center justify-between text-ink-600">
                <span>Subtotal</span>
                <span>{subtotal.toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between text-ink-600">
                <span>Delivery</span>
                <span>0 ETB</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 font-semibold text-foreground">
                <span>Total</span>
                <span>{subtotal.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 text-xs text-ink-400">
          This invoice summarizes a cash-on-delivery order placed through your
          affiliate link.
        </div>
      </section>
    </div>
  );
}
