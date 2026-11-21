import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import { createApplicationSchema } from "@/lib/validations/application";
import { notifyAdminsTelegram } from "@/lib/telegram";
import { escapeHtml } from "@/lib/notifications";
import {
  approvedCreatorCount,
  requestAgainAt,
  spotsLeft,
} from "@/lib/promotion";

export async function GET() {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  const applications = await prisma.application.findMany({
    where: { creatorId: authed.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      decidedAt: true,
      product: {
        select: { id: true, name: true, priceBirr: true, commissionBirr: true },
      },
      affiliateLink: { select: { slug: true } },
    },
  });

  return apiSuccess(applications);
}

// One Application row per creator+product (@@unique). A rejected
// creator may request again REREQUEST_AFTER_DAYS after the decision —
// the same row is reset to PENDING (createdAt = the new request time,
// so it sorts as a fresh request for admin). A product whose creator
// limit is reached can't be requested at all (lib/promotion.ts).
export async function POST(request: NextRequest) {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true, name: true, isPublished: true, stock: true, maxCreators: true },
  });
  // Same visibility rule as the creator catalog: hidden products can't
  // be requested.
  if (!product || !product.isPublished || product.stock <= 0) {
    return apiError("Product not found", 404);
  }

  const existing = await prisma.application.findUnique({
    where: {
      creatorId_productId: { creatorId: authed.id, productId: product.id },
    },
    select: { id: true, status: true, decidedAt: true },
  });
  if (existing?.status === "PENDING" || existing?.status === "APPROVED") {
    return apiError("Already requested this product", 409);
  }
  if (existing?.status === "REJECTED" && existing.decidedAt) {
    const againAt = requestAgainAt(existing.decidedAt);
    if (againAt > new Date()) {
      return apiError(
        `You can request this product again on ${againAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Addis_Ababa" })}`,
        409,
      );
    }
  }

  const left = spotsLeft(product.maxCreators, await approvedCreatorCount(product.id));
  if (left === 0) {
    return apiError("This product is full — no promotion spots left", 409);
  }

  // Upsert, not create: an admin-deleted application is soft-deleted
  // (lib/prisma.ts), so it's invisible to the findUnique above but its
  // row still holds the creator+product unique key — reviving it as a
  // fresh request is the only way that creator can ask again.
  const application = await prisma.application.upsert({
    where: {
      creatorId_productId: { creatorId: authed.id, productId: product.id },
    },
    update: {
      status: "PENDING",
      decidedAt: null,
      createdAt: new Date(),
      deletedAt: null,
    },
    create: { creatorId: authed.id, productId: product.id },
    select: { id: true, status: true, createdAt: true },
  });

  const requester = await prisma.user.findUnique({
    where: { id: authed.id },
    select: { creatorDisplayName: true, creatorUsername: true, email: true },
  });
  await notifyAdminsTelegram(
    `📝 <b>New product request</b>\n${escapeHtml(requester?.creatorDisplayName || requester?.creatorUsername || requester?.email || "A creator")} wants to promote ${escapeHtml(product.name)}`,
  );

  return apiSuccess(application, 201);
}
