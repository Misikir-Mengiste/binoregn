import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, context: RouteContext) {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  const { id } = await context.params;
  const creator = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "CREATOR") {
    return apiError("Creator not found", 404);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: true, deactivatedAt: null },
    select: { id: true, isActive: true },
  });

  return apiSuccess(updated);
}
