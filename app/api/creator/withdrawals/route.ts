import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import { withdrawalRequestSchema } from "@/lib/validations/withdrawal";
import { PayoutMethod, WithdrawalStatus } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  const authed = await requireCreator();
  if (authed instanceof Response) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = withdrawalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { amountBirr, payoutMethod } = parsed.data;

  const [user, paidAgg, withdrawalAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authed.id },
      select: {
        payoutMethod: true,
        payoutAccountName: true,
        payoutAccountNumber: true,
        payoutBankName: true,
      },
    }),
    prisma.commission.aggregate({
      where: { creatorId: authed.id, status: "PAID" },
      _sum: { amountBirr: true },
    }),
    prisma.withdrawal.aggregate({
      where: {
        creatorId: authed.id,
        status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED] },
      },
      _sum: { amountBirr: true },
    }),
  ]);

  if (!user?.payoutAccountNumber || !user.payoutMethod) {
    return apiError("Add your payout method before requesting a withdrawal", 400);
  }

  if (payoutMethod !== user.payoutMethod) {
    return apiError("Update your payout method in settings first", 400);
  }

  if (payoutMethod === "BANK_TRANSFER" && !user.payoutBankName) {
    return apiError("Bank details are incomplete", 400);
  }

  const paidTotal = paidAgg._sum.amountBirr ?? 0;
  const withdrawnTotal = withdrawalAgg._sum.amountBirr ?? 0;
  const available = paidTotal - withdrawnTotal;

  if (amountBirr > available) {
    return apiError("Withdrawal exceeds your available balance", 400);
  }

  const withdrawal = await prisma.withdrawal.create({
    data: {
      creatorId: authed.id,
      amountBirr,
      payoutMethod: payoutMethod === "BANK_TRANSFER" ? PayoutMethod.BANK_TRANSFER : PayoutMethod.TELEBIRR,
      payoutAccountName: user.payoutAccountName,
      payoutAccountNumber: user.payoutAccountNumber,
      payoutBankName: user.payoutBankName,
      status: WithdrawalStatus.PENDING,
    },
    select: { id: true },
  });

  return apiSuccess(withdrawal, 201);
}
