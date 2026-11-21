import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";
import type { SidebarSearchItem } from "@/components/sidebar-search";

const LIMIT = 5;

// Backs the creator sidebar search (components/sidebar-search.tsx) —
// searches the product catalog plus this creator's own applications
// and affiliate links, so "search" actually covers real content, not
// just the static nav labels.
export async function GET(request: NextRequest) {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return apiSuccess({ items: [] satisfies SidebarSearchItem[] });
  }

  const [products, applications, links] = await Promise.all([
    prisma.product.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true },
      take: LIMIT,
    }),
    prisma.application.findMany({
      where: {
        creatorId: authed.id,
        product: { name: { contains: q, mode: "insensitive" } },
      },
      select: { id: true, status: true, product: { select: { name: true } } },
      take: LIMIT,
    }),
    prisma.affiliateLink.findMany({
      where: {
        creatorId: authed.id,
        product: { name: { contains: q, mode: "insensitive" } },
      },
      select: { id: true, product: { select: { name: true } } },
      take: LIMIT,
    }),
  ]);

  const items: SidebarSearchItem[] = [
    ...products.map((product) => ({
      href: `/creator/products/${product.id}`,
      label: product.name,
      group: "Products",
    })),
    ...applications.map((application) => ({
      href: "/creator/applications",
      label: application.product.name,
      group: `Application · ${application.status}`,
    })),
    ...links.map((link) => ({
      href: "/creator/links",
      label: link.product.name,
      group: "My Links",
    })),
  ];

  return apiSuccess({ items });
}
