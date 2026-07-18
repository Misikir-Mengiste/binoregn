import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "./checkout-form";

// Buyer-facing, no auth (architecture.md app/(public) boundary).
// Fetches directly via Prisma (server component convention) —
// intentionally never selects the creator relation, so creator
// identity is never even loaded into this page, let alone
// rendered. Order creation itself still goes through
// POST /api/public/orders (existing, tested), not a direct write
// here — the client form calls that route.
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
      product: {
        select: {
          name: true,
          description: true,
          priceBirr: true,
          imageUrls: true,
        },
      },
    },
  });

  if (!affiliateLink) {
    notFound();
  }

  const { product } = affiliateLink;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-6 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
            A
          </div>
          <span className="text-[15px] font-bold text-foreground">
            Affiliate Market
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
            {product.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrls[0]}
                alt=""
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="aspect-square w-full bg-gradient-to-br from-teal-100 to-blue-100" />
            )}
            <div className="flex flex-col gap-3 p-6">
              <h1 className="text-[24px] leading-tight font-bold text-foreground">
                {product.name}
              </h1>
              <p className="text-[28px] font-bold text-teal-600">
                {product.priceBirr} Birr
              </p>
              {product.description ? (
                <p className="text-sm text-ink-600">{product.description}</p>
              ) : null}
              <p className="text-xs text-ink-400">
                Cash on delivery — no online payment required.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
            <header className="border-b border-border px-5 py-3.5">
              <h2 className="text-[15px] font-bold text-foreground">
                Delivery details
              </h2>
            </header>
            <div className="p-5">
              <CheckoutForm affiliateLinkSlug={affiliateLink.slug} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
