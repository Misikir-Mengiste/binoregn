import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

// A creator can't be hard-deleted — Orders/Commissions/Withdrawals
// reference creatorId via required FKs, and deleting the account would
// either break those or (with cascade) destroy financial history. So
// "delete" here deactivates the account instead: sign-in is blocked
// (see auth.ts) but every record they're attached to stays intact.
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  const { id } = await context.params;
  const creator = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "CREATOR") {
    return apiError("Creator not found", 404);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false, deactivatedAt: new Date() },
    select: { id: true, isActive: true },
  });

  return apiSuccess(updated);
}
