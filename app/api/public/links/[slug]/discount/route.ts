import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { discountForCode } from "@/lib/discount";

// Checkout "Apply" button: is this code valid for the product behind this
// link, and how much does it take off? Answers only yes/no + amount —
// never reveals the product's code. The order route re-checks the code
// when the order is placed (this is just for showing the new price).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.slice(0, 40) : "";
  } catch {
    return apiError("Invalid JSON body", 400);
  }
  if (!code.trim()) return apiError("Enter a discount code.", 400);

  const link = await prisma.affiliateLink.findUnique({
    where: { slug },
    select: {
      product: {
        select: {
          priceBirr: true,
          isPublished: true,
          stock: true,
          discountEnabled: true,
          discountBirr: true,
          discountCode: true,
        },
      },
    },
  });
  if (!link || !link.product.isPublished || link.product.stock <= 0) {
    return apiError("Link not found", 404);
  }

  const discountBirr = discountForCode(link.product, code);
  if (discountBirr === null) {
    return apiError("That discount code isn't valid for this product.", 400);
  }
  return apiSuccess({ discountBirr });
}
