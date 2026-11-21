import { prisma } from "@/lib/prisma";
import { CONTACT_PHONE } from "@/lib/site";

// The single SiteSetting row (prisma/schema.prisma). Until an admin saves
// Settings, the order phone falls back to NEXT_PUBLIC_CONTACT_PHONE and is
// shown only if that env var is set.
const SITE_ID = "site";

export type SiteSettings = {
  orderPhone: string | null;
  showOrderPhone: boolean;
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSetting.findUnique({ where: { id: SITE_ID } });
  if (!row) {
    return { orderPhone: CONTACT_PHONE, showOrderPhone: Boolean(CONTACT_PHONE) };
  }
  return { orderPhone: row.orderPhone, showOrderPhone: row.showOrderPhone };
}

export async function updateSiteSettings(data: SiteSettings) {
  const row = await prisma.siteSetting.upsert({
    where: { id: SITE_ID },
    create: { id: SITE_ID, ...data },
    update: data,
  });
  return { orderPhone: row.orderPhone, showOrderPhone: row.showOrderPhone };
}

/** The number to show on the order confirmation, or null when hidden. */
export async function orderConfirmationPhone() {
  try {
    const { orderPhone, showOrderPhone } = await getSiteSettings();
    return showOrderPhone && orderPhone ? orderPhone : null;
  } catch (error) {
    // Never fail an order over a display setting.
    console.error("[site-settings] could not read order phone:", error);
    return null;
  }
}
