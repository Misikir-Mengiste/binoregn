import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { updateProductSchema } from "@/lib/validations/product";

// No delete endpoint — a product with existing orders/commissions
// can't be removed without breaking historical records, and
// deletion isn't in project-overview.md's scope
// (doc/backend-api-plan.md Open Question 4).
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
