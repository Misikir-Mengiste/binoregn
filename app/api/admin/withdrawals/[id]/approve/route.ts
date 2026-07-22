import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { WithdrawalStatus } from "@/generated/prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, context: RouteContext) {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  const { id } = await context.params;
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!withdrawal) {
    return apiError("Withdrawal not found", 404);
  }
  if (withdrawal.status !== WithdrawalStatus.PENDING) {
    return apiError("Withdrawal already decided", 409);
  }

  const updated = await prisma.withdrawal.update({
    where: { id },
    data: { status: WithdrawalStatus.APPROVED, decidedAt: new Date() },
    select: { id: true },
  });

  return apiSuccess(updated);
}
