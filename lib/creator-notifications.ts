import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

export type CreatorNotificationType =
  | "APPLICATION"
  | "COMMISSION"
  | "PROFILE"
  | "ANNOUNCEMENT";

export type CreatorNotification = {
  id: string;
  type: CreatorNotificationType;
  title: string;
  detail: string;
  at: Date;
  positive: boolean;
  unread: boolean;
  href: string | null;
};

const KIND: Record<
  NotificationType,
  { type: CreatorNotificationType; positive: boolean }
> = {
  PROFILE_APPROVED: { type: "PROFILE", positive: true },
  PROFILE_REJECTED: { type: "PROFILE", positive: false },
  REQUEST_APPROVED: { type: "APPLICATION", positive: true },
  REQUEST_REJECTED: { type: "APPLICATION", positive: false },
  ORDER_DELIVERED: { type: "COMMISSION", positive: true },
  COMMISSION_PAID: { type: "COMMISSION", positive: true },
  ANNOUNCEMENT: { type: "ANNOUNCEMENT", positive: true },
  PRODUCT_PAUSED: { type: "APPLICATION", positive: false },
  PRODUCT_RESUMED: { type: "APPLICATION", positive: true },
};

/**
 * The creator's saved notifications (lib/notifications.ts writes them,
 * dashboard only — no Telegram), newest first. Read state is
 * stored per row — opening the bell marks them read
 * (POST /api/creator/notifications/read).
 */
export async function getCreatorNotifications(
  creatorId: string,
): Promise<CreatorNotification[]> {
  const rows = await prisma.notification.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    ...KIND[row.type],
    title: row.title,
    detail: row.body,
    at: row.createdAt,
    unread: row.readAt === null,
    href: row.href,
  }));
}
