import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { updateProductSchema } from "@/lib/validations/product";

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

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

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
