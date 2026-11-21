import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { createProductSchema } from "@/lib/validations/product";
import { discountSettingsProblem } from "@/lib/discount";

export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(products);
}

export async function POST(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const discountProblem = discountSettingsProblem({
    priceBirr: parsed.data.priceBirr,
    discountEnabled: parsed.data.discountEnabled ?? false,
    discountBirr: parsed.data.discountBirr ?? null,
    discountCode: parsed.data.discountCode ?? null,
  });
  if (discountProblem) return apiError(discountProblem, 400);

  const product = await prisma.product.create({ data: parsed.data });

  return apiSuccess(product, 201);
}
