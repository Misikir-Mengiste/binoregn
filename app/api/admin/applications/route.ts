import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { ApplicationStatus } from "@/generated/prisma/client";

const VALID_STATUSES = Object.values(ApplicationStatus);

export async function GET(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const statusParam = request.nextUrl.searchParams.get("status");
  if (
    statusParam !== null &&
    !VALID_STATUSES.includes(statusParam as ApplicationStatus)
  ) {
    return apiError("Invalid status filter", 400);
  }

  const applications = await prisma.application.findMany({
    where: statusParam
      ? { status: statusParam as ApplicationStatus }
      : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      decidedAt: true,
      creator: { select: { id: true, email: true, name: true } },
      product: { select: { id: true, name: true } },
    },
  });

  return apiSuccess(applications);
}
