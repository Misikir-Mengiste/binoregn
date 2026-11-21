import type { NextRequest } from "next/server";
import { getDuePayouts, payoutCutoff } from "@/lib/commission/payouts";
import { notifyAdminsTelegram, telegramConfigured } from "@/lib/telegram";

// Friday payout reminder to admin on Telegram (progress-tracker
// 2026-11-11): "Payout day: 12 creators · 18,400 Birr", sent only when at
// least one creator reached the minimum. No daily summary.
//
// Called by a server cron once on Friday morning, e.g. (crontab):
//   CRON_TZ=Africa/Addis_Ababa
//   0 9 * * 5  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/payout-reminder
// It only ever sends on a Friday (Addis Ababa), so a misconfigured
// schedule can't spam. It does not record or change any payout.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: { message: "Unauthorized" } }, { status: 401 });
  }

  const weekday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Africa/Addis_Ababa",
  });
  if (weekday !== "Friday") {
    return Response.json({ data: { sent: false, reason: "Not Friday in Addis Ababa" } });
  }

  const due = await getDuePayouts(payoutCutoff());
  if (due.length === 0) {
    return Response.json({ data: { sent: false, reason: "Nobody reached the minimum" } });
  }

  const total = due.reduce((sum, row) => sum + row.amountBirr, 0);
  await notifyAdminsTelegram(
    `💰 <b>Payout day: ${due.length} creator${due.length === 1 ? "" : "s"} · ${total.toLocaleString("en-US")} Birr</b>\nDownload the list from Payouts in your dashboard.`,
  );
  return Response.json({
    data: { sent: telegramConfigured(), creators: due.length, totalBirr: total },
  });
}
