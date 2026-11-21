import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag, Users, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ProductShowcase,
  showcaseProductSelect,
} from "@/components/product/product-showcase";
import { approvedCreatorCount, promoteState, spotsLeft } from "@/lib/promotion";
import { PromoteButton } from "./promote-button";
import { DiscountCode } from "./discount-code";
import { activeDiscountBirr } from "@/lib/discount";

// What a creator sees for one product: the exact buyer design
// (components/product/product-showcase.tsx) plus their commission and a
// single promote button in place of quantity/Buy Now.
export default async function CreatorProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const creatorId = session!.user.id;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      ...showcaseProductSelect,
      id: true,
      commissionBirr: true,
      discountEnabled: true,
      discountBirr: true,
      discountCode: true,
      maxCreators: true,
      isPublished: true,
      stock: true,
      applications: {
        where: { creatorId },
        select: {
          status: true,
          decidedAt: true,
          affiliateLink: { select: { slug: true } },
        },
      },
    },
  });

  // Same visibility rule as the catalog and the public storefront.
  if (!product || !product.isPublished || product.stock <= 0) {
    notFound();
  }

  const application = product.applications[0];
  const left = spotsLeft(product.maxCreators, await approvedCreatorCount(product.id));
  const state = promoteState({
    status: application?.status ?? null,
    decidedAt: application?.decidedAt ?? null,
    linkSlug: application?.affiliateLink?.slug ?? null,
    spotsLeft: left,
  });

  // Creator discount (lib/discount.ts): approved creators get the code to
  // share; everyone else just sees that one exists.
  const discountBirr = activeDiscountBirr(product);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/creator/products"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Products
      </Link>

      <ProductShowcase
        product={product}
        badge={
          <div className="mt-1 flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-pill bg-teal-100 px-3 py-1.5 text-sm font-semibold text-teal-700">
              <Wallet className="h-4 w-4" />
              Commission {product.commissionBirr.toLocaleString("en-US")} ETB
            </span>
            {product.maxCreators !== null ? (
              <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-ink-600">
                <Users className="h-3.5 w-3.5" />
                {left === 0
                  ? "No spots left"
                  : `${left} of ${product.maxCreators} spots left`}
              </span>
            ) : null}
            {discountBirr && product.discountCode ? (
              state.kind === "APPROVED" ? (
                <DiscountCode code={product.discountCode} amountBirr={discountBirr} />
              ) : (
                <span className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-ink-600">
                  <Tag className="h-3.5 w-3.5" />
                  {`Buyers save ${discountBirr.toLocaleString("en-US")} ETB with a creator code — you'll get the code once approved`}
                </span>
              )
            ) : null}
          </div>
        }
        actions={
          <PromoteButton
            productId={product.id}
            productName={product.name}
            state={state}
          />
        }
      />
    </div>
  );
}
