import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CatalogClient } from "./catalog-client";

export default async function CreatorProductsPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      subCategory: true,
      priceBirr: true,
      commissionBirr: true,
      imageUrls: true,
      colors: true,
      sizes: true,
      features: true,
      care: true,
      shipping: true,
      returns: true,
      applications: {
        where: { creatorId },
        select: {
          status: true,
          affiliateLink: { select: { slug: true } },
        },
      },
    },
  });

  const catalog = products.map((product) => {
    const application = product.applications[0];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      subCategory: product.subCategory,
      priceBirr: product.priceBirr,
      commissionBirr: product.commissionBirr,
      imageUrls: product.imageUrls,
      colors: product.colors,
      sizes: product.sizes,
      features: product.features,
      care: product.care,
      shipping: product.shipping,
      returns: product.returns,
      applicationStatus: application?.status ?? null,
      affiliateLinkSlug: application?.affiliateLink?.slug ?? null,
    };
  });

  return (
    <CatalogClient
      products={catalog}
      kpis={{ totalProducts: products.length }}
    />
  );
}
