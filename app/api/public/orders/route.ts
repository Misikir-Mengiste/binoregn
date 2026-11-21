import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createOrderSchema } from "@/lib/validations/order";
import { sendNewOrderAdminEmail } from "@/lib/mailer";
import { notifyAdminsTelegram } from "@/lib/telegram";
import { escapeHtml } from "@/lib/notifications";
import { orderNumber } from "@/lib/order-number";
import { orderConfirmationPhone } from "@/lib/site-settings";
import { discountForCode, normalizeDiscountCode, orderTotalBirr } from "@/lib/discount";

// Creates an order from the public, no-payment checkout flow
// (architecture.md app/(public) boundary — no buyer account).
//
// Attribution is resolved server-side from the affiliate link, not
// trusted from the client, and is immutable from this point on
// (architecture.md invariant 5). Commission is never touched here —
// it's only ever created later by an admin action, through
// lib/commission (not built yet; see progress-tracker.md).
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const {
    affiliateLinkSlug,
    buyerName,
    buyerPhone,
    buyerAddress,
    buyerCity,
    buyerNotes,
    quantity,
    color,
    size,
    discountCode,
  } = parsed.data;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { slug: affiliateLinkSlug },
    select: {
      id: true,
      productId: true,
      creatorId: true,
      product: {
        select: {
          colors: true,
          sizes: true,
          isPublished: true,
          stock: true,
          priceBirr: true,
          discountEnabled: true,
          discountBirr: true,
          discountCode: true,
        },
      },
    },
  });

  // Same "Link not found" the UI would already 404 on (see
  // app/(public)/r/[slug]/page.tsx) — this just guards the
  // API directly in case it's hit without going through that page.
  if (
    !affiliateLink ||
    !affiliateLink.product.isPublished ||
    affiliateLink.product.stock <= 0
  ) {
    return apiError("Link not found", 404);
  }

  const { colors, sizes } = affiliateLink.product;
  if (colors.length > 0 && (!color || !colors.includes(color))) {
    return apiError("Please select a valid color", 400);
  }
  if (sizes.length > 0 && (!size || !sizes.includes(size))) {
    return apiError("Please select a valid size", 400);
  }

  // Creator discount: fixed amount, once per order, only while the
  // product's discount is switched on and the code matches.
  let discountBirr = 0;
  let appliedCode: string | null = null;
  if (discountCode) {
    const amount = discountForCode(affiliateLink.product, discountCode);
    if (amount === null) {
      return apiError("That discount code isn't valid for this product.", 400);
    }
    discountBirr = amount;
    appliedCode = normalizeDiscountCode(discountCode);
  }

  const order = await prisma.order.create({
    data: {
      productId: affiliateLink.productId,
      affiliateLinkId: affiliateLink.id,
      creatorId: affiliateLink.creatorId,
      buyerName,
      buyerPhone,
      buyerAddress,
      buyerCity,
      buyerNotes,
      quantity,
      color: colors.length > 0 ? color : undefined,
      size: sizes.length > 0 ? size : undefined,
      discountBirr,
      discountCode: appliedCode,
    },
    select: {
      id: true,
      deliveryStatus: true,
      createdAt: true,
      product: { select: { name: true, priceBirr: true } },
    },
  });

  // Buyer confirmation is on-screen only (progress-tracker 2026-11-11):
  // the checkout form shows the order number and this tracking link.
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const trackingUrl = host ? `${proto}://${host}/order/${order.id}` : null;

  // Notify every admin (no separate super-admin role — see Role enum
  // in schema.prisma) that a new order needs their attention. The order
  // is already created, so a failed notification must never fail the
  // checkout response.
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    await sendNewOrderAdminEmail(
      admins.map((admin) => admin.email),
      {
        id: order.id,
        buyerName,
        productName: order.product.name,
        priceBirr: order.product.priceBirr,
        quantity,
        discountBirr,
        discountCode: appliedCode,
      },
    );
  } catch (error) {
    console.error("[orders] failed to send admin notification email:", error);
  }

  // Admin Telegram alert (never throws).
  await notifyAdminsTelegram(
    `🛒 <b>New order #${orderNumber(order.id)}</b>\n${escapeHtml(order.product.name)} × ${quantity} — ${orderTotalBirr({ priceBirr: order.product.priceBirr, quantity, discountBirr }).toLocaleString("en-US")} Birr${appliedCode ? ` (code ${escapeHtml(appliedCode)}, −${discountBirr.toLocaleString("en-US")})` : ""}\n${escapeHtml(buyerName)} · ${escapeHtml(buyerCity)}`,
  );

  return apiSuccess(
    {
      ...order,
      trackingUrl,
      // Shown with a "Call now" button on the confirmation; null when the
      // admin hid it in Settings (lib/site-settings.ts).
      contactPhone: await orderConfirmationPhone(),
    },
    201,
  );
}
