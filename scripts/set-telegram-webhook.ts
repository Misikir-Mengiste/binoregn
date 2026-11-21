// One-time setup: point the Telegram bot at this site's webhook.
//   npm run telegram:webhook -- https://your-domain.com
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in .env. Telegram
// only accepts HTTPS URLs, so this is for the deployed site, not
// localhost.
import "dotenv/config";
import dns from "node:dns";

// Same IPv4-first fix as instrumentation.ts — IPv6 to Telegram can hang.
dns.setDefaultResultOrder("ipv4first");

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const base = process.argv[2]?.replace(/\/$/, "");
  if (!token || !secret) {
    throw new Error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in .env first.");
  }
  if (!base || !base.startsWith("https://")) {
    throw new Error("Pass your site's https URL, e.g. npm run telegram:webhook -- https://binoregn.com");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${base}/api/telegram/webhook`,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  });
  const body = await response.json();
  console.log(body.ok ? `Webhook set to ${base}/api/telegram/webhook` : body);
  if (!body.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
