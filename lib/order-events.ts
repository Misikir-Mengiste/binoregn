import { prisma } from "@/lib/prisma";
import {
  birrText,
  escapeHtml,
  notifyCreator,
  notifyProductAvailability,
} from "@/lib/notifications";
import { notifyAdminsTelegram } from "@/lib/telegram";
import { orderNumber } from "@/lib/order-number";

// Stock at or below this after a delivery triggers an admin alert.
export const LOW_STOCK_THRESHOLD = 5;

// Side effects of an order becoming Delivered, run by the admin order
// routes right after lib/commission created its (PENDING) commission:
// one creator notification (covers "order delivered" + "commission
// added") and a low/out-of-stock alert for admin. Never throws.
export async function afterOrderDelivered(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        creatorId: true,
        commission: { select: { amountBirr: true } },
        productId: true,
        product: { select: { name: true, stock: true, isPublished: true } },
      },
    });
    if (!order) return;

    if (order.commission) {
      await notifyCreator(order.creatorId, {
        type: "ORDER_DELIVERED",
        title: `Order delivered · +${birrText(order.commission.amountBirr)}`,
        body: `${order.product.name} (order #${orderNumber(order.id)}) was delivered. The commission is pending and will be paid on a Friday.`,
        href: "/creator/earnings",
      });
    }

    const { stock, name } = order.product;
    if (stock <= 0) {
      // This delivery used the last unit — links to it now show "not
      // found", so creators promoting it get told to pause.
      if (order.product.isPublished) {
        await notifyProductAvailability(order.productId, false);
      }
      await notifyAdminsTelegram(
        `🔴 <b>Out of stock:</b> ${escapeHtml(name)}\nIt's now hidden from creators and buyers until you add stock.`,
      );
    } else if (stock <= LOW_STOCK_THRESHOLD) {
      await notifyAdminsTelegram(
        `🟠 <b>Low stock:</b> ${escapeHtml(name)} — ${stock} left`,
      );
    }
  } catch (error) {
    console.error("[order-events] afterOrderDelivered failed:", error);
  }
}
