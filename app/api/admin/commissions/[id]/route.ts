import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

// Soft delete — see lib/prisma.ts. Commission is a financial ledger
// (architecture.md invariant 2: forward-only None→Pending→Paid, and
// invariant 6: only lib/commission creates/transitions these rows), so
// a hard delete would erase money owed/paid history.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  const existing = await prisma.commission.findUnique({ where: { id } });
  if (!existing) {
    return apiError("Commission not found", 404);
  }

  await prisma.commission.delete({ where: { id } });

  return apiSuccess({ id });
}
