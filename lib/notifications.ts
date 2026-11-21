import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCreatorEmail, type CreatorEmail } from "@/lib/mailer";
import type { NotificationType } from "@/generated/prisma/client";

// Creator notifications. Every event is saved for the creator's dashboard
// bell AND emailed to the creator's account email (progress-tracker
// 2026-11-21 — all creators, new and existing, no opt-in needed). A few
// account events are email-only (emailCreator). Creators don't get
// Telegram messages (removed 2026-11-11) — Telegram is admin-only
// (lib/telegram.ts). Callers run these AFTER their own write succeeded,
// and a notification failure must never undo or fail that action — so
// nothing here throws. Emails go out after the response is sent.

export type NotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
};

// Admin Telegram alerts use parse_mode HTML, so user-entered text
// (product names, buyer names) must be escaped.
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function birrText(amount: number) {
  return `${amount.toLocaleString("en-US")} Birr`;
}

const CTA_LABEL: Record<NotificationType, string> = {
  PROFILE_APPROVED: "Browse products",
  PROFILE_REJECTED: "Open Binoregn",
  REQUEST_APPROVED: "Get your link",
  REQUEST_REJECTED: "See your applications",
  ORDER_DELIVERED: "View earnings",
  COMMISSION_PAID: "View earnings",
  ANNOUNCEMENT: "Open your dashboard",
  PRODUCT_PAUSED: "See your links",
  PRODUCT_RESUMED: "Copy your link",
};

// Runs work after the HTTP response when called inside a request (so
// admin actions aren't slowed by SMTP); runs it now otherwise (scripts).
function inBackground(task: () => Promise<unknown>) {
  const safe = () => task().catch((error) => console.error("[notifications]", error));
  try {
    after(safe);
  } catch {
    void safe();
  }
}

type Recipient = { email: string; name: string | null };

async function recipient(creatorId: string): Promise<Recipient | null> {
  const user = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { email: true, name: true, creatorDisplayName: true, creatorUsername: true },
  });
  if (!user?.email) return null;
  return {
    email: user.email,
    name: user.name || user.creatorDisplayName || user.creatorUsername || null,
  };
}

async function emailTo(creatorId: string, email: CreatorEmail) {
  const to = await recipient(creatorId);
  if (to) await sendCreatorEmail(to.email, email, to.name);
}

/** Dashboard bell + email. */
export async function notifyCreator(
  creatorId: string,
  notification: NotificationInput,
) {
  try {
    await prisma.notification.create({
      data: { creatorId, ...notification },
    });
  } catch (error) {
    console.error("[notifications] could not save notification:", error);
  }

  inBackground(() =>
    emailTo(creatorId, {
      subject: notification.title,
      heading: notification.title,
      body: notification.body,
      href: notification.href ?? "/creator",
      ctaLabel: CTA_LABEL[notification.type],
    }),
  );
}

/** Email only — account events that don't belong in the bell. */
export function emailCreator(creatorId: string, email: CreatorEmail) {
  inBackground(() => emailTo(creatorId, email));
}

// Small concurrency cap so a big announcement doesn't open hundreds of
// SMTP connections at once.
async function forEachLimited<T>(items: T[], limit: number, fn: (item: T) => Promise<unknown>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

// Admin announcement → every approved, active creator (bell + email).
export async function sendAnnouncement(title: string, body: string) {
  const creators = await prisma.user.findMany({
    where: { role: "CREATOR", creatorProfileStatus: "APPROVED", isActive: true },
    select: { id: true, email: true, name: true, creatorDisplayName: true },
  });
  const creatorIds = creators.map((creator) => creator.id);

  const announcement = await prisma.$transaction(async (tx) => {
    const created = await tx.announcement.create({ data: { title, body } });
    await tx.notification.createMany({
      data: creatorIds.map((creatorId) => ({
        creatorId,
        type: "ANNOUNCEMENT" as const,
        title,
        body,
        announcementId: created.id,
      })),
    });
    return created;
  });

  inBackground(() =>
    forEachLimited(creators, 5, (creator) =>
      sendCreatorEmail(
        creator.email,
        {
          subject: title,
          heading: title,
          body,
          href: "/creator",
          ctaLabel: CTA_LABEL.ANNOUNCEMENT,
        },
        creator.name || creator.creatorDisplayName,
      ),
    ),
  );

  return { announcement, recipients: creatorIds.length };
}

/** Whether buyers can open links to this product right now. */
export function isProductAvailable(product: { isPublished: boolean; stock: number }) {
  return product.isPublished && product.stock > 0;
}

// When a product goes unavailable (unpublished or out of stock) its
// affiliate links show "not found" — tell every active creator who has a
// link so they stop sharing it, and tell them again when it's back.
// Call only on an actual change (was available → isn't, or back).
export async function notifyProductAvailability(
  productId: string,
  available: boolean,
) {
  try {
    const links = await prisma.affiliateLink.findMany({
      where: { productId, creator: { isActive: true } },
      select: { creatorId: true, product: { select: { name: true } } },
    });
    for (const link of links) {
      await notifyCreator(
        link.creatorId,
        available
          ? {
              type: "PRODUCT_RESUMED",
              title: `${link.product.name} is available again`,
              body: "Your affiliate link works again — you can keep sharing it.",
              href: "/creator/links",
            }
          : {
              type: "PRODUCT_PAUSED",
              title: `${link.product.name} is paused`,
              body: "This product is out of stock or unpublished, so your link shows \"not found\" for now. Pause sharing it — we'll let you know when it's back.",
              href: "/creator/links",
            },
      );
    }
  } catch (error) {
    console.error("[notifications] product availability notice failed:", error);
  }
}
