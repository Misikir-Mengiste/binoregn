import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { decideApplicationSchema } from "@/lib/validations/application";

// Approving creates the AffiliateLink in the same transaction as
// the status update — architecture.md invariant 3 ("an affiliate
// link is generated only after admin approval") enforced at the
// code level, not just documented.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = decideApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    return apiError("Application not found", 404);
  }
  if (application.status !== "PENDING") {
    return apiError("Application has already been decided", 409);
  }

  const { decision } = parsed.data;

  if (decision === "REJECTED") {
    const updated = await prisma.application.update({
      where: { id },
      data: { status: "REJECTED", decidedAt: new Date() },
    });
    return apiSuccess(updated);
  }

  const [updated, affiliateLink] = await prisma.$transaction([
    prisma.application.update({
      where: { id },
      data: { status: "APPROVED", decidedAt: new Date() },
    }),
    prisma.affiliateLink.create({
      data: {
        creatorId: application.creatorId,
        productId: application.productId,
        applicationId: application.id,
      },
    }),
  ]);

  return apiSuccess({ ...updated, affiliateLinkSlug: affiliateLink.slug });
}
