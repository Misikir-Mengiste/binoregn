import { prisma } from "@/lib/prisma";

// Telegram bot (progress-tracker 2026-11-11). Admin alerts only —
// creators are notified in their dashboard, not on Telegram (removed
// 2026-11-11, user request). Everything here is best-effort and
// silent when the bot isn't configured (TELEGRAM_BOT_TOKEN unset), so
// local dev and tests never depend on Telegram.
//
// Linking: a user opens https://t.me/<bot>?start=<token> from their
// settings page; Telegram delivers "/start <token>" to our webhook
// (app/api/telegram/webhook), which stores their chat id on User. Only
// admins can link (app/api/telegram/link); alerts go to every ADMIN with
// a linked chat.

const API = "https://api.telegram.org";

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export function telegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "") || null;
}

export async function sendTelegramMessage(chatId: string, html: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const response = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
      // Never let a slow Telegram API hold up an admin action.
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`[telegram] sendMessage ${response.status}: ${body.slice(0, 200)}`);
      // 403 = the user blocked the bot / deleted the chat: unlink so we
      // stop trying.
      if (response.status === 403) {
        await prisma.user
          .updateMany({ where: { telegramChatId: chatId }, data: { telegramChatId: null } })
          .catch(() => {});
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error("[telegram] sendMessage failed:", error);
    return false;
  }
}

async function sendToUsers(where: { role: "ADMIN" }, html: string) {
  if (!telegramConfigured()) return;
  const users = await prisma.user.findMany({
    where: { ...where, telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  await Promise.allSettled(
    users.map((user) => sendTelegramMessage(user.telegramChatId!, html)),
  );
}

// Admin alerts: new order, new creator signup, new product request,
// low/out-of-stock, payouts due. Never throws.
export async function notifyAdminsTelegram(html: string) {
  try {
    await sendToUsers({ role: "ADMIN" }, html);
  } catch (error) {
    console.error("[telegram] admin alert failed:", error);
  }
}
