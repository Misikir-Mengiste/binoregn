import { prisma } from "@/lib/prisma";
import { WithdrawalsClient } from "./withdrawals-client";

export default async function AdminWithdrawalsPage() {
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

  return <WithdrawalsClient withdrawals={withdrawals} />;
}
