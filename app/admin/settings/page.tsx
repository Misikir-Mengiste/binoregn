import { prisma } from "@/lib/prisma";
import { PayoutOptionsClient } from "./payout-options-client";

export default async function AdminSettingsPage() {
  const options = await prisma.payoutOption.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const banks = options
    .filter((option) => option.category === "BANK")
    .map((option) => ({ ...option, createdAt: option.createdAt.toISOString() }));
  const wallets = options
    .filter((option) => option.category === "WALLET")
    .map((option) => ({ ...option, createdAt: option.createdAt.toISOString() }));

  return <PayoutOptionsClient banks={banks} wallets={wallets} />;
}
