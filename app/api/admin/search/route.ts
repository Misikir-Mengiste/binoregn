import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import type { SidebarSearchItem } from "@/components/sidebar-search";

const LIMIT = 5;

// Backs the admin sidebar search (components/sidebar-search.tsx) —
// searches products, orders (by buyer name), creators, and applications
// so "search" covers real content, not just the static nav labels.
export async function GET(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return apiSuccess({ items: [] satisfies SidebarSearchItem[] });
  }

  const [products, orders, creators, applications] = await Promise.all([
    prisma.product.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true },
      take: LIMIT,
    }),
    prisma.order.findMany({
      where: { buyerName: { contains: q, mode: "insensitive" } },
      select: { id: true, buyerName: true },
      take: LIMIT,
    }),
    prisma.user.findMany({
      where: {
        role: "CREATOR",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { creatorUsername: { contains: q, mode: "insensitive" } },
          { creatorDisplayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, email: true, name: true, creatorDisplayName: true },
      take: LIMIT,
    }),
    prisma.application.findMany({
      where: { product: { name: { contains: q, mode: "insensitive" } } },
      select: { id: true, status: true, product: { select: { name: true } } },
      take: LIMIT,
    }),
  ]);

  const items: SidebarSearchItem[] = [
    ...products.map((product) => ({
      href: "/admin/products",
      label: product.name,
      group: "Products",
    })),
    ...orders.map((order) => ({
      href: `/admin/orders/${order.id}/invoice`,
      label: order.buyerName,
      group: "Orders",
    })),
    ...creators.map((creator) => ({
      href: `/admin/creators/${creator.id}`,
      label: creator.creatorDisplayName || creator.name || creator.email,
      group: "Creators",
    })),
    ...applications.map((application) => ({
      href: "/admin/applications",
      label: application.product.name,
      group: `Application · ${application.status}`,
    })),
  ];

  return apiSuccess({ items });
}
