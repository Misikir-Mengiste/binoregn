import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { affiliateLinkPath } from "@/lib/affiliate-link-path";
import {
  ProductShowcase,
  showcaseProductSelect,
} from "@/components/product/product-showcase";
import { GlassBackdrop } from "@/components/product/glass-backdrop";
import { ProductPurchasePanel } from "./product-purchase-panel";
import { LinkViewBeacon } from "./link-view-beacon";
import { Tag } from "lucide-react";
import { activeDiscountBirr } from "@/lib/discount";

// Buyer-facing, no auth (architecture.md app/(public) boundary).
// The URL is just /r/[slug] — a short random code with no creator
// identity in it, and the page only renders product data.
export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { slug },
    select: {
      slug: true,
      creatorId: true,
      product: {
        select: {
          ...showcaseProductSelect,
          colors: true,
          sizes: true,
          isPublished: true,
          stock: true,
          discountEnabled: true,
          discountBirr: true,
          discountCode: true,
        },
      },
    },
  });

  // Unpublished (manually, or automatically once stock hits 0) means the
  // product's own public page is gone too — same as if the link never
  // existed. See prisma/schema.prisma's Product.isPublished comment.
  if (!affiliateLink || !affiliateLink.product.isPublished || affiliateLink.product.stock <= 0) {
    notFound();
  }

  const { product } = affiliateLink;
  // Only the amount goes to the page — never the code (creators share it).
  const discountBirr = activeDiscountBirr(product);
  // Recommendations are this creator's OTHER affiliate links only — never
  // another creator's products, and never the creator's identity. If the
  // creator has no other links, the section is hidden entirely. Also
  // excludes unpublished/out-of-stock products, same rule as above.
  const recommendedLinks = await prisma.affiliateLink.findMany({
    where: {
      creatorId: affiliateLink.creatorId,
      slug: { not: affiliateLink.slug },
      product: { isPublished: true, stock: { gt: 0 } },
    },
    select: {
      slug: true,
      product: {
        select: {
          name: true,
          priceBirr: true,
          compareAtBirr: true,
          imageUrls: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Views are counted from the browser by LinkViewBeacon — once per
  // visitor per 24h (app/api/public/links/[slug]/view/route.ts), so
  // reloads, repeat clicks and link-preview crawlers don't inflate it.
  return (
    <div className="relative isolate flex-1">
      <LinkViewBeacon slug={affiliateLink.slug} />
      <GlassBackdrop />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-6 sm:px-6 lg:py-10">
        <ProductShowcase
          product={product}
          badge={
            discountBirr ? (
              <p className="mt-1 inline-flex w-fit items-center gap-2 rounded-pill bg-mint-100 px-3 py-1.5 text-sm font-semibold text-mint-500">
                <Tag className="h-4 w-4" />
                Have a Discount Code? Save {discountBirr.toLocaleString("en-US")} ETB at Checkout
              </p>
            ) : undefined
          }
          actions={
            <ProductPurchasePanel
              orderHref={`${affiliateLinkPath(affiliateLink.slug)}/order`}
              affiliateLinkSlug={affiliateLink.slug}
              productName={product.name}
              imageUrl={product.imageUrls[0] ?? null}
              priceBirr={product.priceBirr}
              discountAvailableBirr={discountBirr}
              colors={product.colors}
              sizes={product.sizes}
              showAddToCart={
                product.sizes.length > 0 || product.colors.length > 0
              }
            />
          }
        />

        {recommendedLinks.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              More to Explore
            </h2>
            <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {recommendedLinks.map((link) => (
                <Link
                  key={link.slug}
                  href={affiliateLinkPath(link.slug)}
                  className="group w-[180px] shrink-0 snap-start rounded-[20px] border border-border/80 bg-white/85 shadow-card backdrop-blur-md p-4 transition-transform hover:-translate-y-0.5 sm:w-[220px]"
                >
                  <div className="overflow-hidden rounded-[16px] bg-surface-100">
                    {link.product.imageUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={link.product.imageUrls[0]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-[4/3] w-full bg-surface-100" />
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {link.product.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-foreground">
                        {link.product.priceBirr.toLocaleString("en-US")} ETB
                      </span>
                      {link.product.compareAtBirr &&
                      link.product.compareAtBirr > link.product.priceBirr ? (
                        <span className="text-xs text-ink-400 line-through">
                          {link.product.compareAtBirr.toLocaleString("en-US")} ETB
                        </span>
                      ) : null}
                    </div>
                    <span className="inline-flex h-9 w-full items-center justify-center rounded-pill bg-teal-600 text-xs font-semibold text-white transition-colors group-hover:bg-teal-700">
                      View product
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
