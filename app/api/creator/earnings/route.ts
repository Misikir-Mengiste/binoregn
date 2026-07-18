import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";

export async function GET() {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  const commissions = await prisma.commission.findMany({
    where: { creatorId: authed.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amountBirr: true,
      status: true,
      createdAt: true,
      paidAt: true,
      order: {
        select: { id: true, product: { select: { name: true } } },
      },
    },
  });

  const pendingBirr = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.amountBirr, 0);
  const paidBirr = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.amountBirr, 0);

  return apiSuccess({ pendingBirr, paidBirr, commissions });
}
