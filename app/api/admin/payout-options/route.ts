import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { createPayoutOptionSchema } from "@/lib/validations/payout-option";
import { Prisma } from "@/generated/prisma/client";

export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  const options = await prisma.payoutOption.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return apiSuccess(options);
}

export async function POST(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = createPayoutOptionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const existingCount = await prisma.payoutOption.count({
    where: { category: parsed.data.category },
  });

  try {
    const option = await prisma.payoutOption.create({
      data: { ...parsed.data, sortOrder: existingCount },
    });
    return apiSuccess(option, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("This option already exists in that category", 409);
    }
    throw error;
  }
}
