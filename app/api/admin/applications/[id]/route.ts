import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { decideApplicationSchema } from "@/lib/validations/application";
import { generateAffiliateLinkCode } from "@/lib/affiliate-link-code";
import {
  approvedCreatorCount,
  REREQUEST_AFTER_DAYS,
  spotsLeft,
} from "@/lib/promotion";
import { birrText, notifyCreator } from "@/lib/notifications";

function notifyApproved(application: {
  creatorId: string;
  productId: string;
  product: { name: string; commissionBirr: number };
}) {
  return notifyCreator(application.creatorId, {
    type: "REQUEST_APPROVED",
    title: `Approved: ${application.product.name}`,
    body: `Your link is ready. You earn ${birrText(application.product.commissionBirr)} per delivered sale.`,
    href: `/creator/products/${application.productId}`,
  });
}
import { Prisma } from "@/generated/prisma/client";

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

  const application = await prisma.application.findUnique({
    where: { id },
    include: { product: { select: { name: true, commissionBirr: true } } },
  });
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
    await notifyCreator(application.creatorId, {
      type: "REQUEST_REJECTED",
      title: `Request not approved: ${application.product.name}`,
      body: `You can request it again in ${REREQUEST_AFTER_DAYS} days.`,
      href: `/creator/products/${application.productId}`,
    });
    return apiSuccess(updated);
  }

  // A creator who was approved before keeps their original link (e.g.
  // an admin-deleted application that the creator requested again) —
  // re-approving must not mint a second link for the same pair.
  const existingLink = await prisma.affiliateLink.findUnique({
    where: {
      creatorId_productId: {
        creatorId: application.creatorId,
        productId: application.productId,
      },
    },
    select: { slug: true },
  });
  if (existingLink) {
    const updated = await prisma.application.update({
      where: { id },
      data: { status: "APPROVED", decidedAt: new Date() },
    });
    await notifyApproved(application);
    return apiSuccess({ ...updated, affiliateLinkSlug: existingLink.slug });
  }

  // Creator limit (lib/promotion.ts): each approval takes a spot.
  const product = await prisma.product.findUnique({
    where: { id: application.productId },
    select: { maxCreators: true },
  });
  const left = spotsLeft(
    product?.maxCreators ?? null,
    await approvedCreatorCount(application.productId),
  );
  if (left === 0) {
    return apiError(
      "This product is full — raise its creator limit to approve more creators",
      409,
    );
  }

  // The short link code is random, so on the (astronomically rare)
  // unique-index collision just roll back and try a fresh code.
  for (let attempt = 1; ; attempt++) {
    try {
      const [updated, affiliateLink] = await prisma.$transaction([
        prisma.application.update({
          where: { id },
          data: { status: "APPROVED", decidedAt: new Date() },
        }),
        prisma.affiliateLink.create({
          data: {
            slug: generateAffiliateLinkCode(),
            creatorId: application.creatorId,
            productId: application.productId,
            applicationId: application.id,
          },
        }),
      ]);

      await notifyApproved(application);
      return apiSuccess({ ...updated, affiliateLinkSlug: affiliateLink.slug });
    } catch (error) {
      if (
        attempt < 3 &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
}

// Soft delete — see lib/prisma.ts. Application isn't independently
// referenced by Order/Commission (those go through AffiliateLink), so
// this is safe regardless of status; the row and its approval history
// stay in the database.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  const existing = await prisma.application.findUnique({ where: { id } });
  if (!existing) {
    return apiError("Application not found", 404);
  }

  await prisma.application.delete({ where: { id } });

  return apiSuccess({ id });
}
