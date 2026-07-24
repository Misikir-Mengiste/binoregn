import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

// Soft delete — see lib/prisma.ts. Withdrawal is a payout request
// record (architecture.md invariant 10: pending until approved or
// rejected), so the row stays for audit purposes even once hidden.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  const existing = await prisma.withdrawal.findUnique({ where: { id } });
  if (!existing) {
    return apiError("Withdrawal not found", 404);
  }

  await prisma.withdrawal.delete({ where: { id } });

  return apiSuccess({ id });
}
