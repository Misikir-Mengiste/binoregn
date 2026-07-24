import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createOrderSchema } from "@/lib/validations/order";
import { sendOrderTrackingEmail } from "@/lib/mailer";

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
    buyerEmail,
    buyerNotes,
    quantity,
  } = parsed.data;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { slug: affiliateLinkSlug },
    select: { id: true, productId: true, creatorId: true },
  });

  if (!affiliateLink) {
    return apiError("Link not found", 404);
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
      buyerEmail,
      buyerNotes,
      quantity,
    },
    select: {
      id: true,
      deliveryStatus: true,
      createdAt: true,
      product: { select: { name: true, priceBirr: true } },
    },
  });

  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const trackingUrl = host ? `${proto}://${host}/order/${order.id}` : null;

  // The order is already created — a failed tracking email must never
  // fail the checkout response.
  if (buyerEmail && trackingUrl) {
    try {
      await sendOrderTrackingEmail(buyerEmail, trackingUrl);
    } catch (error) {
      console.error("[orders] failed to send tracking email:", error);
    }
  }

  return apiSuccess(
    {
      ...order,
      trackingUrl,
    },
    201,
  );
}
