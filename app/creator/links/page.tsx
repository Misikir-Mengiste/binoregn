import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { LinksListClient } from "./links-list-client";

// Link path is /p/[creator]/[slug] — built at
// app/(public)/p/[creator]/[slug]/page.tsx.
export default async function CreatorLinksPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const [links, creator] = await Promise.all([
    prisma.affiliateLink.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        viewCount: true,
        product: {
          select: {
            name: true,
            commissionBirr: true,
            imageUrls: true,
          },
        },
        // Only count orders once admin has confirmed delivery — see
        // app/creator/page.tsx for why undelivered orders stay hidden.
        _count: {
          select: { orders: { where: { deliveryStatus: "DELIVERED" } } },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: creatorId },
      select: { creatorUsername: true, email: true },
    }),
  ]);

  const linksWithStats = links.map((link) => ({
    slug: link.slug,
    viewCount: link.viewCount,
    orderCount: link._count.orders,
    product: link.product,
  }));

  const totals = {
    links: linksWithStats.length,
    views: linksWithStats.reduce((sum, link) => sum + link.viewCount, 0),
    orders: linksWithStats.reduce((sum, link) => sum + link.orderCount, 0),
  };

  const creatorSlug =
    creator?.creatorUsername?.trim() ||
    creator?.email?.split("@")[0] ||
    "creator";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Links"
        description="Share these with buyers — you earn a commission on every completed order."
      />

      <LinksListClient
        links={linksWithStats}
        creatorSlug={creatorSlug}
        totals={totals}
      />
    </div>
  );
}
