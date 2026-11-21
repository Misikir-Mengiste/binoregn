import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { telegramBotUsername, telegramConfigured } from "@/lib/telegram";

// Connect / disconnect the signed-in ADMIN's Telegram for admin alerts
// (lib/telegram.ts). Creators can't link — they're notified in their
// dashboard only. POST returns a one-time deep link;
// the bot webhook (app/api/telegram/webhook) completes the link when
// they press Start.
async function currentUser() {
  const session = await auth();
  return session?.user?.id && session.user.role === "ADMIN" ? session.user.id : null;
}

export async function POST() {
  const userId = await currentUser();
  if (!userId) return apiError("Unauthorized", 401);
  const bot = telegramBotUsername();
  if (!telegramConfigured() || !bot) {
    return apiError("Telegram isn't set up on this site yet", 503);
  }

  const token = randomBytes(16).toString("base64url");
  await prisma.user.update({
    where: { id: userId },
    data: { telegramLinkToken: token },
  });
  return apiSuccess({ url: `https://t.me/${bot}?start=${token}` });
}

export async function DELETE() {
  const userId = await currentUser();
  if (!userId) return apiError("Unauthorized", 401);
  await prisma.user.update({
    where: { id: userId },
    data: { telegramChatId: null, telegramLinkToken: null },
  });
  return apiSuccess({ connected: false });
}
