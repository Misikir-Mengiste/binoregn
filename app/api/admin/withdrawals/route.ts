import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amountBirr: true,
      status: true,
      createdAt: true,
      payoutMethod: true,
      payoutAccountName: true,
      payoutAccountNumber: true,
      payoutBankName: true,
      creator: { select: { email: true, name: true, creatorUsername: true } },
    },
  });

  return apiSuccess(withdrawals);
}
