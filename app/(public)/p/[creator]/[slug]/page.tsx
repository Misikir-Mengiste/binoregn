import { notFound } from "next/navigation";
import Link from "next/link";
import { Percent, RotateCcw, Truck, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RichText } from "@/components/rich-text";
import { ProductPurchasePanel } from "./product-purchase-panel";
import { ProductGallery } from "./product-gallery";
import { CollapsibleCard } from "./collapsible-card";

// Buyer-facing, no auth (architecture.md app/(public) boundary).
// Creator username appears in the URL for shareability, but the
// page still only renders product data (no creator identity).
export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ creator: string; slug: string }>;
}) {
  const { creator, slug } = await params;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { slug },
    select: {
      slug: true,
      creatorId: true,
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subCategory: true,
          features: true,
          care: true,
          shipping: true,
          returns: true,
          colors: true,
          sizes: true,
          priceBirr: true,
          compareAtBirr: true,
          rating: true,
          ratingCount: true,
          soldCount: true,
          sellerName: true,
          sellerVerified: true,
          sellerRating: true,
          sellerSoldCount: true,
          shippingDiscountLabel: true,
          shippingPackageLabel: true,
          shippingDeliveryTime: true,
          shippingArrives: true,
          imageUrls: true,
        },
      },
    },
  });

  if (!affiliateLink) {
    notFound();
  }

  const { product } = affiliateLink;
  // Recommendations are this creator's OTHER affiliate links only — never
  // another creator's products, and never the creator's identity. If the
  // creator has no other links, the section is hidden entirely.
  const recommendedLinks = await prisma.affiliateLink.findMany({
    where: {
      creatorId: affiliateLink.creatorId,
      slug: { not: affiliateLink.slug },
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
    take: 4,
  });

  // A simple view counter, not commission-relevant state — a failed
  // increment must never break the actual page render.
  await prisma.affiliateLink
    .update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  // Delivery Options always shows all four rows. Values prefer real
  // product data, then the admin-entered shipping array, then a
  // platform-policy default (this is a single-seller COD marketplace, so
  // payment/delivery/returns are uniform site-wide). Discount shows a real
  // % only when there's a genuine compare-at price — otherwise the admin
  // discount label or a neutral fallback (never a fabricated percentage).
  const discountPercent =
    product.compareAtBirr && product.compareAtBirr > product.priceBirr
      ? Math.round((1 - product.priceBirr / product.compareAtBirr) * 100)
      : null;

  const deliveryItems = [
    {
      icon: Percent,
      label: "Discount",
      value: discountPercent
        ? `Disc ${discountPercent}%`
        : product.shippingDiscountLabel ?? product.shipping[0] ?? "No discount",
    },
    { icon: Wallet, label: "Payment", value: "Cash on Delivery Available" },
    {
      icon: Truck,
      label: "Delivery Time",
      value:
        product.shippingDeliveryTime ??
        product.shipping[2] ??
        "3–4 Working Days",
    },
    {
      icon: RotateCcw,
      label: "Return & Warranty",
      value: product.returns[0] ?? "7 Days easy return",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <ProductGallery images={product.imageUrls} />

          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[28px] font-bold text-foreground sm:text-[32px]">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[22px] font-bold text-foreground">
                  {product.priceBirr.toLocaleString()} ETB
                </p>
                {product.compareAtBirr &&
                product.compareAtBirr > product.priceBirr ? (
                  <p className="text-sm text-ink-400 line-through">
                    {product.compareAtBirr.toLocaleString()} ETB
                  </p>
                ) : null}
              </div>
            </div>

            {product.description ? (
              <CollapsibleCard title="Description">
                <RichText html={product.description} />
              </CollapsibleCard>
            ) : null}

            {product.sizes.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-base font-bold text-foreground">Size</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-pill border border-border bg-card px-4 py-2 text-sm text-ink-600"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ProductPurchasePanel
              orderHref={`/p/${creator}/${affiliateLink.slug}/order`}
              colors={product.colors}
              showAddToCart={
                product.sizes.length > 0 || product.colors.length > 0
              }
            />

            <CollapsibleCard title="Delivery Options">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                {deliveryItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-100">
                      <Icon className="h-5 w-5 text-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-ink-400">{label}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          </div>
        </div>

        {recommendedLinks.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              More from this creator
            </h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {recommendedLinks.map((link) => (
                <Link
                  key={link.slug}
                  href={`/p/${creator}/${link.slug}`}
                  className="group rounded-[20px] border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
                >
                  <div className="overflow-hidden rounded-[16px] bg-surface-100">
                    {link.product.imageUrls[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={link.product.imageUrls[0]}
                        alt=""
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
                        {link.product.priceBirr.toLocaleString()} ETB
                      </span>
                      {link.product.compareAtBirr &&
                      link.product.compareAtBirr > link.product.priceBirr ? (
                        <span className="text-xs text-ink-400 line-through">
                          {link.product.compareAtBirr.toLocaleString()} ETB
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
