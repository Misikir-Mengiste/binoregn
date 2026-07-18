import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";

export async function GET() {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  const links = await prisma.affiliateLink.findMany({
    where: { creatorId: authed.id },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      createdAt: true,
      product: {
        select: { id: true, name: true, priceBirr: true, commissionBirr: true },
      },
    },
  });

  return apiSuccess(links);
}
