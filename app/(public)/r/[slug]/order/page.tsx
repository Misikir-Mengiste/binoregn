import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "../../_components/checkout-form";
import { activeDiscountBirr } from "@/lib/discount";

// Fallback for the checkout modal: Buy Now normally opens the one-step
// form as a modal on the product page (product-purchase-panel.tsx), but
// its links still point here (no-JS, opened in a new tab). Same form,
// shown as a centred card. Quantity/colour/size come from the link's
// query string (?qty=&color=&size=), as before.
export default async function OrderCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ qty?: string; color?: string; size?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { slug },
    select: {
      slug: true,
      product: {
        select: {
          name: true,
          priceBirr: true,
          imageUrls: true,
          isPublished: true,
          stock: true,
          discountEnabled: true,
          discountBirr: true,
          discountCode: true,
        },
      },
    },
  });

  // Same visibility rule as the product page — see
  // app/(public)/r/[slug]/page.tsx.
  if (!affiliateLink || !affiliateLink.product.isPublished || affiliateLink.product.stock <= 0) {
    notFound();
  }

  const { product } = affiliateLink;
  const qty = Number.parseInt(query.qty ?? "1", 10);

  return (
    <main className="flex-1 bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[460px] rounded-[24px] border border-border/80 bg-white p-5 shadow-card sm:p-6">
        <CheckoutForm
          affiliateLinkSlug={affiliateLink.slug}
          productName={product.name}
          priceBirr={product.priceBirr}
          imageUrl={product.imageUrls[0] ?? null}
          initialQuantity={Number.isNaN(qty) ? 1 : qty}
          color={query.color || undefined}
          size={query.size || undefined}
          discountAvailableBirr={activeDiscountBirr(product)}
        />
      </div>
    </main>
  );
}
