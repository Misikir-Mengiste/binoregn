import { prisma } from "@/lib/prisma";

export type AdminNotificationType = "APPLICATION" | "CREATOR" | "WITHDRAWAL" | "ORDER";

export type AdminNotification = {
  id: string;
  type: AdminNotificationType;
  title: string;
  detail: string;
  at: Date;
  href: string;
};

function creatorName(creator: {
  creatorDisplayName: string | null;
  name: string | null;
  email: string;
}) {
  return creator.creatorDisplayName || creator.name || creator.email;
}

/**
 * Items waiting on an admin decision: new product applications, new
 * creator onboarding submissions, new withdrawal requests, and newly
 * placed orders. Unlike the creator-facing feed (which reports
 * decisions already made), this is an action queue: everything here
 * is still PENDING/PLACED, mirroring the "Pending" counts already
 * shown on the Applications/Creators/Withdrawals/Orders list pages.
 */
export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const [applications, creators, withdrawals, orders] = await Promise.all([
    prisma.application.findMany({
      where: { status: "PENDING", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        creator: {
          select: { creatorDisplayName: true, name: true, email: true },
        },
        product: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        role: "CREATOR",
        creatorProfileStatus: "PENDING",
        creatorOnboardingCompletedAt: { not: null },
      },
      orderBy: { creatorOnboardingCompletedAt: "desc" },
      take: 8,
      select: {
        id: true,
        creatorOnboardingCompletedAt: true,
        creatorDisplayName: true,
        name: true,
        email: true,
      },
    }),
    prisma.withdrawal.findMany({
      where: { status: "PENDING", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        amountBirr: true,
        createdAt: true,
        creator: {
          select: { creatorDisplayName: true, name: true, email: true },
        },
      },
    }),
    prisma.order.findMany({
      where: { deliveryStatus: "PLACED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        buyerName: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const events: AdminNotification[] = [];

  for (const application of applications) {
    events.push({
      id: `app-${application.id}`,
      type: "APPLICATION",
      title: "New application",
      detail: `${creatorName(application.creator)} applied for ${application.product.name}`,
      at: application.createdAt,
      href: "/admin/applications",
    });
  }

  for (const creator of creators) {
    events.push({
      id: `creator-${creator.id}`,
      type: "CREATOR",
      title: "New creator application",
      detail: `${creatorName(creator)} completed onboarding, awaiting approval`,
      // Non-null: query filtered on creatorOnboardingCompletedAt not null.
      at: creator.creatorOnboardingCompletedAt as Date,
      href: `/admin/creators/${creator.id}`,
    });
  }

  for (const withdrawal of withdrawals) {
    events.push({
      id: `wd-${withdrawal.id}`,
      type: "WITHDRAWAL",
      title: "Withdrawal request",
      detail: `${creatorName(withdrawal.creator)} requested ${withdrawal.amountBirr.toLocaleString()} ETB`,
      at: withdrawal.createdAt,
      href: "/admin/withdrawals",
    });
  }

  for (const order of orders) {
    events.push({
      id: `order-${order.id}`,
      type: "ORDER",
      title: "New order",
      detail: `${order.buyerName} ordered ${order.product.name}`,
      at: order.createdAt,
      href: "/admin/orders",
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events.slice(0, 20);
}
