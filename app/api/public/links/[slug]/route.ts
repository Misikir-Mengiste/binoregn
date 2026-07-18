import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";

// Resolves a creator's affiliate link to the product it points at,
// for rendering the creator-attributed public landing page
// (architecture.md app/(public) boundary — no auth required).
//
// Only product data is returned — never the creator's identity.
// Attribution is tracked internally on the order; the buyer
// doesn't need to know, and shouldn't be able to discover, which
// creator a link belongs to.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const affiliateLink = await prisma.affiliateLink.findUnique({
    where: { slug },
    select: {
      slug: true,
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          priceBirr: true,
          imageUrls: true,
        },
      },
    },
  });

  if (!affiliateLink) {
    return apiError("Link not found", 404);
  }

  return apiSuccess({
    affiliateLinkSlug: affiliateLink.slug,
    product: affiliateLink.product,
  });
}
