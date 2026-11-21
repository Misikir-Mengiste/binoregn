import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { notifyCreator } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

// Body is optional for backwards compatibility: no body = approve.
const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]).default("APPROVED"),
});

// Admin decides a creator's onboarding profile. Rejected creators stay
// on the pending page (app/creator/layout.tsx only lets APPROVED in);
// either way the creator is notified (dashboard notification).
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  let body: unknown = {};
  const raw = await request.text();
  if (raw.trim()) {
    try {
      body = JSON.parse(raw);
    } catch {
      return apiError("Invalid JSON body", 400);
    }
  }
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }
  const { decision } = parsed.data;

  const { id } = await context.params;
  const creator = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      creatorOnboardingCompletedAt: true,
      creatorProfileStatus: true,
    },
  });
  if (!creator || creator.role !== "CREATOR") {
    return apiError("Creator not found", 404);
  }
  if (!creator.creatorOnboardingCompletedAt) {
    return apiError("Creator has not completed onboarding", 409);
  }
  if (creator.creatorProfileStatus === decision) {
    return apiError(`Creator is already ${decision.toLowerCase()}`, 409);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { creatorProfileStatus: decision },
    select: { id: true, creatorProfileStatus: true },
  });

  await notifyCreator(
    id,
    decision === "APPROVED"
      ? {
          type: "PROFILE_APPROVED",
          title: "Your creator profile is approved",
          body: "Welcome to Binoregn! Browse products and request the ones you want to promote.",
          href: "/creator/products",
        }
      : {
          type: "PROFILE_REJECTED",
          title: "Your creator profile wasn't approved",
          body: "Contact us if you think this is a mistake or want to update your details.",
        },
  );

  return apiSuccess(updated);
}
