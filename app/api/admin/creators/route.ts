import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof Response) return authed;

  const creators = await prisma.user.findMany({
    where: { role: "CREATOR", creatorOnboardingCompletedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      creatorUsername: true,
      creatorDisplayName: true,
      creatorPlatform: true,
      creatorCategory: true,
      creatorProfileStatus: true,
      createdAt: true,
    },
  });

  return apiSuccess(creators);
}
