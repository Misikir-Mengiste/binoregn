import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";

export async function GET() {
  const authed = await requireCreator();
  if (authed instanceof Response) return authed;

  const options = await prisma.payoutOption.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, category: true, name: true, logoUrl: true },
  });

  return apiSuccess(options);
}
