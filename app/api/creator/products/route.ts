import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";

// Full catalog, each product annotated with this creator's own
// application status (null if never applied) and affiliate link
// slug if approved — never another creator's data.
export async function GET() {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      applications: {
        where: { creatorId: authed.id },
        select: {
          status: true,
          affiliateLink: { select: { slug: true } },
        },
      },
    },
  });

  const data = products.map((product) => {
    const application = product.applications[0];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      priceBirr: product.priceBirr,
      commissionBirr: product.commissionBirr,
      imageUrls: product.imageUrls,
      applicationStatus: application?.status ?? null,
      affiliateLinkSlug: application?.affiliateLink?.slug ?? null,
    };
  });

  return apiSuccess(data);
}
