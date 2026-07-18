import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { CommissionStatus } from "@/generated/prisma/client";

const VALID_STATUSES = Object.values(CommissionStatus);

export async function GET(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const statusParam = request.nextUrl.searchParams.get("status");
  if (
    statusParam !== null &&
    !VALID_STATUSES.includes(statusParam as CommissionStatus)
  ) {
    return apiError("Invalid status filter", 400);
  }

  const commissions = await prisma.commission.findMany({
    where: statusParam ? { status: statusParam as CommissionStatus } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amountBirr: true,
      status: true,
      createdAt: true,
      paidAt: true,
      creator: {
        select: {
          id: true,
          email: true,
          name: true,
          payoutMethod: true,
          payoutAccountName: true,
          payoutAccountNumber: true,
          payoutBankName: true,
        },
      },
      order: { select: { id: true, product: { select: { name: true } } } },
    },
  });

  return apiSuccess(commissions);
}
