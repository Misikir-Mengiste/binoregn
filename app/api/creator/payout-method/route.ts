import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import { payoutMethodSchema } from "@/lib/validations/payout";
import { alertIfPayoutChanged } from "@/lib/payout-change-alert";

const PAYOUT_SELECT = {
  payoutMethod: true,
  payoutAccountName: true,
  payoutAccountNumber: true,
  payoutBankName: true,
} as const;

export async function GET() {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  const user = await prisma.user.findUnique({
    where: { id: authed.id },
    select: PAYOUT_SELECT,
  });

  return apiSuccess(user);
}

export async function PATCH(request: NextRequest) {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = payoutMethodSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { payoutMethod, payoutAccountName, payoutAccountNumber } =
    parsed.data;
  const payoutBankName =
    parsed.data.payoutMethod === "BANK_TRANSFER"
      ? parsed.data.payoutBankName
      : null;

  const before = await prisma.user.findUnique({
    where: { id: authed.id },
    select: PAYOUT_SELECT,
  });

  const user = await prisma.user.update({
    where: { id: authed.id },
    data: {
      payoutMethod,
      payoutAccountName,
      payoutAccountNumber,
      payoutBankName,
    },
    select: PAYOUT_SELECT,
  });

  alertIfPayoutChanged(authed.id, before, user);

  return apiSuccess(user);
}
