import { notFound } from "next/navigation";
import Link from "next/link";
import { Heart, Percent, RotateCcw, Star, Truck, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
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
  const ratingValue = product.rating ?? 4.7;
  const soldValue = product.soldCount ?? 1000;
  const sellerName = product.sellerName ?? "Binoregn";
  const sellerRating = product.sellerRating ?? ratingValue;
  const sellerSoldCount = product.sellerSoldCount ?? soldValue;
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
          rating: true,
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

  // Real discount from a genuine compare-at price only (no fabricated
  // fallback), else fall back to the admin-entered discount label.
  const discountPercent =
    product.compareAtBirr && product.compareAtBirr > product.priceBirr
      ? Math.round((1 - product.priceBirr / product.compareAtBirr) * 100)
      : null;

  const deliveryItems = [
    discountPercent
      ? { icon: Percent, label: "Discount", value: `Disc ${discountPercent}%` }
      : product.shippingDiscountLabel
        ? {
            icon: Percent,
            label: "Discount",
            value: product.shippingDiscountLabel,
          }
        : null,
    // COD is the platform's payment model (architecture.md) — always true.
    { icon: Wallet, label: "Payment", value: "Cash on Delivery Available" },
    product.shippingDeliveryTime
      ? {
          icon: Truck,
          label: "Delivery Time",
          value: product.shippingDeliveryTime,
        }
      : null,
    product.returns[0]
      ? { icon: RotateCcw, label: "Return & Warranty", value: product.returns[0] }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <div className="min-h-screen bg-surface-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <ProductGallery images={product.imageUrls} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[28px] font-bold text-foreground sm:text-[32px]">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-[22px] font-bold text-foreground">
                  {product.priceBirr.toLocaleString()} Birr
                </p>
                {product.compareAtBirr &&
                product.compareAtBirr > product.priceBirr ? (
                  <p className="text-sm text-ink-400 line-through">
                    {product.compareAtBirr.toLocaleString()} Birr
                  </p>
                ) : null}
              </div>
            </div>

            {product.description ? (
              <CollapsibleCard title="Description">
                <p className="text-sm leading-relaxed text-ink-600">
                  {product.description}
                </p>
              </CollapsibleCard>
            ) : null}

            {product.features.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-base font-bold text-foreground">Main Notes</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.features.map((item) => (
                    <span
                      key={item}
                      className="rounded-pill border border-border bg-card px-4 py-2 text-sm text-ink-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <ProductPurchasePanel
              orderHref={`/p/${creator}/${affiliateLink.slug}/order`}
              colors={product.colors}
              sizes={product.sizes}
            />

            {deliveryItems.length > 0 && (
              <CollapsibleCard title="Delivery Options">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {deliveryItems.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                        <Icon className="h-4 w-4 text-ink-600" />
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
            )}
          </div>
        </div>

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between rounded-[20px] border border-border bg-card px-4 py-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100 text-sm font-semibold text-foreground">
                {sellerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{sellerName}</p>
                  {product.sellerVerified ? (
                    <span className="rounded-pill bg-surface-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                      Verified
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-400">
                  <Star className="h-3.5 w-3.5 text-orange-500" />
                  <span>{sellerRating.toFixed(1)} rating</span>
                  <span>•</span>
                  <span>Sold {sellerSoldCount}+</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="rounded-pill border border-border bg-foreground px-4 py-2 text-xs font-semibold text-white"
            >
              Follow
            </button>
          </div>

          {recommendedLinks.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recommendations</h2>
                <span className="text-xs text-ink-400">View all</span>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {recommendedLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={`/p/${creator}/${link.slug}`}
                    className="group rounded-[20px] border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
                  >
                    <div className="relative overflow-hidden rounded-[16px] bg-surface-100">
                      <button
                        type="button"
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-ink-400"
                        onClick={(event) => event.preventDefault()}
                        aria-label="Save"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
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
                          {link.product.priceBirr} Birr
                        </span>
                        {link.product.compareAtBirr ||
                        link.product.compareAtBirr === 0 ? (
                          <span className="text-xs text-ink-400 line-through">
                            {link.product.compareAtBirr} Birr
                          </span>
                        ) : (
                          <span className="text-xs text-ink-400 line-through">
                            {Math.round(link.product.priceBirr * 1.2)} Birr
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-ink-400">
                        <Star className="h-3.5 w-3.5 text-orange-500" />
                        {(link.product.rating ?? 4.7).toFixed(1)}
                      </div>
                      <span className="inline-flex h-9 w-full items-center justify-center rounded-pill border border-border text-xs font-semibold text-foreground">
                        Add to Cart
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
