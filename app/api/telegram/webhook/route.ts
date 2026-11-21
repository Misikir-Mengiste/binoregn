import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

// Telegram bot webhook. Registered with Telegram via
// `npm run telegram:webhook` (scripts/set-telegram-webhook.ts), which
// sets TELEGRAM_WEBHOOK_SECRET as the secret token — Telegram echoes it
// in this header on every call, so anyone else hitting this URL is
// rejected.
//
// Handles only what linking needs:
//   /start <token>  → link this chat to the user who created the token
//   /stop           → unlink this chat
type Update = {
  message?: { text?: string; chat?: { id?: number | string; type?: string } };
};

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  const update = (await request.json().catch(() => null)) as Update | null;
  const text = update?.message?.text?.trim() ?? "";
  const chatId = update?.message?.chat?.id;
  // Only private chats: a group chat id would leak one user's
  // notifications to everyone in the group.
  if (chatId === undefined || update?.message?.chat?.type !== "private") {
    return Response.json({ ok: true });
  }
  const chat = String(chatId);

  if (text.startsWith("/start")) {
    const token = text.split(/\s+/)[1];
    const user = token
      ? await prisma.user.findUnique({
          where: { telegramLinkToken: token },
          select: { id: true, role: true },
        })
      : null;

    if (!user) {
      await sendTelegramMessage(
        chat,
        "Hi! To get Binoregn notifications here, open <b>Settings</b> in your Binoregn dashboard and tap <b>Connect Telegram</b>.",
      );
      return Response.json({ ok: true });
    }

    // One chat ↔ one account: unlink it from anyone else first.
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { telegramChatId: chat, NOT: { id: user.id } },
        data: { telegramChatId: null },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: chat, telegramLinkToken: null },
      }),
    ]);
    await sendTelegramMessage(
      chat,
      user.role === "ADMIN"
        ? "✅ Connected. You'll get admin alerts here: new orders, signups, product requests, stock and payout reminders. Send /stop to turn them off."
        : "✅ Connected. You'll get your Binoregn notifications here. Send /stop to turn them off.",
    );
    return Response.json({ ok: true });
  }

  if (text === "/stop") {
    await prisma.user.updateMany({
      where: { telegramChatId: chat },
      data: { telegramChatId: null },
    });
    await sendTelegramMessage(
      chat,
      "Notifications turned off. Reconnect any time from Settings.",
    );
  }

  return Response.json({ ok: true });
}
