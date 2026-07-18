import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./catalog-client";

export default async function CreatorProductsPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const [products, approvedCount, pendingCount] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          where: { creatorId },
          select: {
            status: true,
            affiliateLink: { select: { slug: true } },
          },
        },
      },
    }),
    prisma.application.count({ where: { creatorId, status: "APPROVED" } }),
    prisma.application.count({ where: { creatorId, status: "PENDING" } }),
  ]);

  const catalog = products.map((product) => {
    const application = product.applications[0];
    return {
      id: product.id,
      name: product.name,
      priceBirr: product.priceBirr,
      commissionBirr: product.commissionBirr,
      imageUrls: product.imageUrls,
      applicationStatus: application?.status ?? null,
      affiliateLinkSlug: application?.affiliateLink?.slug ?? null,
    };
  });

  return (
    <CatalogClient
      products={catalog}
      kpis={{
        totalProducts: products.length,
        approvedLinks: approvedCount,
        pendingApplications: pendingCount,
      }}
    />
  );
}
