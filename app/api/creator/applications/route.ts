import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import { createApplicationSchema } from "@/lib/validations/application";

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

// Applying twice to the same product is permanently blocked by the
// schema's @@unique([creatorId, productId]) on Application — a
// rejected creator can't currently re-apply. That's a deliberate
// MVP simplification (doc/backend-api-plan.md Open Question 1),
// not an oversight; revisit if it turns out to matter.
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
    select: { id: true },
  });
  if (!product) {
    return apiError("Product not found", 404);
  }

  const existing = await prisma.application.findUnique({
    where: {
      creatorId_productId: { creatorId: authed.id, productId: product.id },
    },
    select: { id: true },
  });
  if (existing) {
    return apiError("Already applied to this product", 409);
  }

  const application = await prisma.application.create({
    data: { creatorId: authed.id, productId: product.id },
    select: { id: true, status: true, createdAt: true },
  });

  return apiSuccess(application, 201);
}
