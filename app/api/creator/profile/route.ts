import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import { creatorProfileSchema } from "@/lib/validations/creator-onboarding";
import { resolvePayoutChoice } from "@/lib/payout-choice";
import { alertIfPayoutChanged } from "@/lib/payout-change-alert";

const PAYOUT_SELECT = {
  payoutMethod: true,
  payoutAccountName: true,
  payoutAccountNumber: true,
  payoutBankName: true,
} as const;

export async function PATCH(request: NextRequest) {
  const authed = await requireCreator();
  if (authed instanceof Response) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  // Username isn't editable in Settings — any username in the body is
  // ignored (stripped by the schema), and the stored one is kept as is.
  const parsed = creatorProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const {
    fullName,
    phone,
    displayName,
    platform,
    profileUrl,
    category,
    payoutOptionId,
    payoutAccountName,
    payoutAccountNumber,
  } = parsed.data;

  // One option from the admin list; number checked for that option.
  const payout = await resolvePayoutChoice({
    payoutOptionId,
    payoutAccountName,
    payoutAccountNumber,
  });
  if (!payout.ok) return apiError(payout.error, 400);
  const payoutFields = payout.fields;

  const before = await prisma.user.findUnique({
    where: { id: authed.id },
    select: PAYOUT_SELECT,
  });

  const user = await prisma.user.update({
    where: { id: authed.id },
    data: {
      name: fullName,
      creatorPhone: phone,
      creatorDisplayName: displayName,
      creatorPlatform: platform,
      creatorProfileUrl: profileUrl,
      creatorCategory: category,
      ...payoutFields,
    },
    select: { id: true, ...PAYOUT_SELECT },
  });

  alertIfPayoutChanged(authed.id, before, user);

  return apiSuccess({ id: user.id });
}
