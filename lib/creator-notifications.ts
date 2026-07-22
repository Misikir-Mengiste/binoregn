import { prisma } from "@/lib/prisma";

export type CreatorNotificationType =
  | "APPLICATION"
  | "COMMISSION"
  | "WITHDRAWAL";

export type CreatorNotification = {
  id: string;
  type: CreatorNotificationType;
  title: string;
  detail: string;
  at: Date;
  positive: boolean;
};

/**
 * Recent activity for a creator, derived entirely from their real
 * data (application decisions, commission lifecycle, withdrawal
 * decisions) — there is no separate notifications table in the MVP,
 * so this is a read-only feed, not a read/unread inbox.
 */
export async function getCreatorNotifications(
  creatorId: string,
): Promise<CreatorNotification[]> {
  const [applications, commissions, withdrawals] = await Promise.all([
    prisma.application.findMany({
      where: {
        creatorId,
        status: { in: ["APPROVED", "REJECTED"] },
        decidedAt: { not: null },
      },
      orderBy: { decidedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        decidedAt: true,
        product: { select: { name: true } },
      },
    }),
    prisma.commission.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        amountBirr: true,
        status: true,
        createdAt: true,
        paidAt: true,
        order: { select: { product: { select: { name: true } } } },
      },
    }),
    prisma.withdrawal.findMany({
      where: {
        creatorId,
        status: { in: ["APPROVED", "REJECTED"] },
        decidedAt: { not: null },
      },
      orderBy: { decidedAt: "desc" },
      take: 8,
      select: { id: true, amountBirr: true, status: true, decidedAt: true },
    }),
  ]);

  const events: CreatorNotification[] = [];

  for (const application of applications) {
    const approved = application.status === "APPROVED";
    events.push({
      id: `app-${application.id}`,
      type: "APPLICATION",
      title: approved ? "Application approved" : "Application rejected",
      detail: application.product.name,
      at: application.decidedAt!,
      positive: approved,
    });
  }

  for (const commission of commissions) {
    if (commission.status === "PAID" && commission.paidAt) {
      events.push({
        id: `commission-paid-${commission.id}`,
        type: "COMMISSION",
        title: `${commission.amountBirr.toLocaleString()} Birr paid`,
        detail: commission.order.product.name,
        at: commission.paidAt,
        positive: true,
      });
    } else {
      events.push({
        id: `commission-pending-${commission.id}`,
        type: "COMMISSION",
        title: `${commission.amountBirr.toLocaleString()} Birr commission earned`,
        detail: `${commission.order.product.name} · pending payout`,
        at: commission.createdAt,
        positive: true,
      });
    }
  }

  for (const withdrawal of withdrawals) {
    const approved = withdrawal.status === "APPROVED";
    events.push({
      id: `withdrawal-${withdrawal.id}`,
      type: "WITHDRAWAL",
      title: approved ? "Withdrawal approved" : "Withdrawal rejected",
      detail: `${withdrawal.amountBirr.toLocaleString()} Birr`,
      at: withdrawal.decidedAt!,
      positive: approved,
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events.slice(0, 10);
}
