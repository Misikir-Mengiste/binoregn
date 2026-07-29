import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "../../../_components/checkout-form";

export default async function OrderCheckoutPage({
  params,
}: {
  params: Promise<{ creator: string; slug: string }>;
}) {
  const { slug } = await params;

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
        },
      },
    },
  });

  // Same visibility rule as the product page — see
  // app/(public)/p/[creator]/[slug]/page.tsx.
  if (!affiliateLink || !affiliateLink.product.isPublished || affiliateLink.product.stock <= 0) {
    notFound();
  }

  const { product } = affiliateLink;

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-card">
            {product.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrls[0]}
                alt=""
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="aspect-[4/3] w-full bg-teal-100" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{product.name}</p>
            <p className="text-sm text-ink-600">{product.priceBirr} ETB</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-border bg-card shadow-card">
          <div className="p-5">
            <CheckoutForm
              affiliateLinkSlug={affiliateLink.slug}
              productName={product.name}
              priceBirr={product.priceBirr}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
