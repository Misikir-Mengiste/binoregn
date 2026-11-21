import { prisma } from "@/lib/prisma";
import { ProductsClient } from "./products-client";
import { requireAdminPage } from "@/lib/auth-helpers";

export default async function AdminProductsPage() {
  await requireAdminPage();
  const [products, activeLinkCount, pendingApplicationCount] =
    await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { applications: true, affiliateLinks: true },
          },
        },
      }),
      prisma.affiliateLink.count(),
      prisma.application.count({ where: { status: "PENDING" } }),
    ]);

  const avgCommissionBirr =
    products.length === 0
      ? 0
      : Math.round(
          products.reduce((sum, p) => sum + p.commissionBirr, 0) /
            products.length,
        );

  return (
    <ProductsClient
      initialProducts={products}
      kpis={{
        totalProducts: products.length,
        activeLinks: activeLinkCount,
        avgCommissionBirr,
        pendingApplications: pendingApplicationCount,
      }}
    />
  );
}
