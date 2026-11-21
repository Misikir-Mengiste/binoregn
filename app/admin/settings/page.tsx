import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { TelegramConnect } from "@/components/telegram-connect";
import { telegramConfigured } from "@/lib/telegram";
import { getSiteSettings } from "@/lib/site-settings";
import { PayoutOptionsClient } from "./payout-options-client";
import { OrderPhoneSettings } from "./order-phone-settings";
import { requireAdminPage } from "@/lib/auth-helpers";

export default async function AdminSettingsPage() {
  await requireAdminPage();
  const session = await auth();
  const admin = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { telegramChatId: true },
  });
  const siteSettings = await getSiteSettings();
  const options = await prisma.payoutOption.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const banks = options
    .filter((option) => option.category === "BANK")
    .map((option) => ({ ...option, createdAt: option.createdAt.toISOString() }));
  const wallets = options
    .filter((option) => option.category === "WALLET")
    .map((option) => ({ ...option, createdAt: option.createdAt.toISOString() }));

  return (
    <PayoutOptionsClient banks={banks} wallets={wallets}>
      <OrderPhoneSettings
        initialPhone={siteSettings.orderPhone}
        initialVisible={siteSettings.showOrderPhone}
      />
      <TelegramConnect
        configured={telegramConfigured()}
        connected={Boolean(admin?.telegramChatId)}
        description="Admin alerts: new orders, creator signups, product requests, low stock and the Friday payout reminder."
      />
    </PayoutOptionsClient>
  );
}
