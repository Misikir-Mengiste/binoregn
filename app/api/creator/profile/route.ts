import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import { creatorOnboardingSchema } from "@/lib/validations/creator-onboarding";
import { PayoutMethod } from "@/generated/prisma/client";

export async function PATCH(request: NextRequest) {
  const authed = await requireCreator();
  if (authed instanceof Response) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = creatorOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const {
    fullName,
    username,
    phone,
    displayName,
    platform,
    profileUrl,
    category,
    payoutMethod,
    telebirrPhone,
    bankName,
    bankAccountName,
    bankAccountNumber,
  } = parsed.data;

  const existingUsername = await prisma.user.findUnique({
    where: { creatorUsername: username },
    select: { id: true },
  });
  if (existingUsername && existingUsername.id !== authed.id) {
    return apiError("That username is already taken", 409);
  }

  const payoutFields =
    payoutMethod === "TELEBIRR"
      ? {
          payoutMethod: PayoutMethod.TELEBIRR,
          payoutAccountNumber: telebirrPhone ?? null,
          payoutAccountName: fullName,
          payoutBankName: null,
        }
      : {
          payoutMethod: PayoutMethod.BANK_TRANSFER,
          payoutAccountNumber: bankAccountNumber ?? null,
          payoutAccountName: bankAccountName ?? null,
          payoutBankName: bankName ?? null,
        };

  const user = await prisma.user.update({
    where: { id: authed.id },
    data: {
      name: fullName,
      creatorUsername: username,
      creatorPhone: phone,
      creatorDisplayName: displayName,
      creatorPlatform: platform,
      creatorProfileUrl: profileUrl,
      creatorCategory: category,
      ...payoutFields,
    },
    select: { id: true },
  });

  return apiSuccess(user);
}
