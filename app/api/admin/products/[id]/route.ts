import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { updateProductSchema } from "@/lib/validations/product";
import { isProductAvailable, notifyProductAvailability } from "@/lib/notifications";
import { discountSettingsProblem } from "@/lib/discount";

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

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return apiError("Product not found", 404);
  }

  // Only the fields the request actually sent. updateProductSchema is
  // createProductSchema.partial(), and zod still fills in the create
  // defaults (stock 100, empty images/colors/sizes/features…) for
  // missing keys — so the list's Publish toggle ({ isPublished }) used
  // to wipe the product's images and reset its stock.
  const sent = body as Record<string, unknown>;
  const data = Object.fromEntries(
    Object.entries(parsed.data).filter(([key]) => key in sent),
  ) as typeof parsed.data;

  // Discount rules on the values the product will have after this edit.
  const discountProblem = discountSettingsProblem({
    priceBirr: data.priceBirr ?? existing.priceBirr,
    discountEnabled: data.discountEnabled ?? existing.discountEnabled,
    discountBirr: data.discountBirr !== undefined ? data.discountBirr : existing.discountBirr,
    discountCode: data.discountCode !== undefined ? data.discountCode : existing.discountCode,
  });
  if (discountProblem) return apiError(discountProblem, 400);

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  // Unpublished / out of stock ↔ back: creators with links hear about it.
  const wasAvailable = isProductAvailable(existing);
  const nowAvailable = isProductAvailable(product);
  if (wasAvailable !== nowAvailable) {
    await notifyProductAvailability(id, nowAvailable);
  }

  return apiSuccess(product);
}

// A hard delete — Product isn't a financial/audit record, but it can
// have real activity (applications, affiliate links, orders) that
// would be orphaned by removing it, so deletion is blocked whenever
// any exists rather than silently cascading.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return apiError("Product not found", 404);
  }

  const [applicationCount, orderCount, affiliateLinkCount] = await Promise.all([
    prisma.application.count({ where: { productId: id } }),
    prisma.order.count({ where: { productId: id } }),
    prisma.affiliateLink.count({ where: { productId: id } }),
  ]);

  if (applicationCount > 0 || orderCount > 0 || affiliateLinkCount > 0) {
    return apiError(
      `Can't delete — this product has ${applicationCount} application(s), ${affiliateLinkCount} affiliate link(s), and ${orderCount} order(s) tied to it.`,
      409,
    );
  }

  await prisma.product.delete({ where: { id } });

  return apiSuccess({ id });
}
