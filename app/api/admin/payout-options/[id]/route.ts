import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { updatePayoutOptionSchema } from "@/lib/validations/payout-option";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = updatePayoutOptionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { id } = await context.params;
  const option = await prisma.payoutOption.findUnique({ where: { id } });
  if (!option) {
    return apiError("Payout option not found", 404);
  }

  const updated = await prisma.payoutOption.update({
    where: { id },
    data: { isActive: parsed.data.isActive },
  });

  return apiSuccess(updated);
}

// Pure reference data (bank/wallet names) with no FK relations pointing
// at it — payoutBankName on User/Payout is a plain string snapshot,
// not a foreign key — so a hard delete is safe at any time.
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  const { id } = await context.params;
  const option = await prisma.payoutOption.findUnique({ where: { id } });
  if (!option) {
    return apiError("Payout option not found", 404);
  }

  await prisma.payoutOption.delete({ where: { id } });

  return apiSuccess({ id });
}
