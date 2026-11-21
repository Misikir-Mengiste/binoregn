import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { promoteState, spotsLeft } from "@/lib/promotion";
import { CatalogClient } from "./catalog-client";

export default async function CreatorProductsPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const [products, approvedCounts] = await Promise.all([
    prisma.product.findMany({
      where: { isPublished: true, stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        priceBirr: true,
        commissionBirr: true,
        imageUrls: true,
        sizes: true,
        maxCreators: true,
        applications: {
          where: { creatorId },
          select: {
            status: true,
            decidedAt: true,
            affiliateLink: { select: { slug: true } },
          },
        },
      },
    }),
    // Approved creators per product = affiliate links per product
    // (lib/promotion.ts) — one grouped query instead of one per card.
    prisma.affiliateLink.groupBy({ by: ["productId"], _count: { _all: true } }),
  ]);

  const approvedByProduct = new Map(
    approvedCounts.map((row) => [row.productId, row._count._all]),
  );

  const now = new Date();
  const catalog = products.map((product) => {
    const application = product.applications[0];
    const left = spotsLeft(
      product.maxCreators,
      approvedByProduct.get(product.id) ?? 0,
    );
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      priceBirr: product.priceBirr,
      commissionBirr: product.commissionBirr,
      imageUrls: product.imageUrls,
      sizes: product.sizes,
      spotsLeft: left,
      promoteKind: promoteState({
        status: application?.status ?? null,
        decidedAt: application?.decidedAt ?? null,
        linkSlug: application?.affiliateLink?.slug ?? null,
        spotsLeft: left,
        now,
      }).kind,
    };
  });

  return (
    <CatalogClient
      products={catalog}
      kpis={{ totalProducts: products.length }}
    />
  );
}
