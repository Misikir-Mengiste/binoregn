import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

// Soft delete — see lib/prisma.ts. Order is a financial/audit record
// (architecture.md invariant 4: status changes only through explicit
// admin actions) and may already have a Commission tied to it via a
// required FK, so the row is hidden from lists rather than dropped.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return apiError("Order not found", 404);
  }

  await prisma.order.delete({ where: { id } });

  return apiSuccess({ id });
}
