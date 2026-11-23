import type { NextRequest } from "next/server";
import { notifyAdminsTelegram } from "@/lib/telegram";
import { emailCreator, escapeHtml } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import { creatorOnboardingSchema } from "@/lib/validations/creator-onboarding";
import { CreatorProfileStatus } from "@/generated/prisma/client";
import { resolvePayoutChoice } from "@/lib/payout-choice";

export async function POST(request: NextRequest) {
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
    payoutOptionId,
    payoutAccountName,
    payoutAccountNumber,
  } = parsed.data;

  const existingUsername = await prisma.user.findUnique({
    where: { creatorUsername: username },
    select: { id: true },
  });
  if (existingUsername && existingUsername.id !== authed.id) {
    return apiError("That username is already taken", 409);
  }

  // One option from the admin list; number checked for that option.
  const payout = await resolvePayoutChoice({
    payoutOptionId,
    payoutAccountName,
    payoutAccountNumber,
  });
  if (!payout.ok) return apiError(payout.error, 400);
  const payoutFields = payout.fields;

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
      creatorProfileStatus: CreatorProfileStatus.PENDING,
      creatorOnboardingCompletedAt: new Date(),
      ...payoutFields,
    },
    select: { id: true },
  });

  await notifyAdminsTelegram(
    `🙋 <b>New creator signup</b>\n${escapeHtml(displayName || fullName)} (@${escapeHtml(username)}) · ${escapeHtml(String(platform))}\nWaiting for your approval.`,
  );

  emailCreator(authed.id, {
    subject: "We received your creator application",
    heading: "Thanks for applying to Binoregn",
    body: "Your creator profile is under review. We usually reply within 1–2 working days, and we'll email you as soon as it's approved.",
    href: "/creator",
    ctaLabel: "Check your status",
  });

  return apiSuccess(user, 200);
}
