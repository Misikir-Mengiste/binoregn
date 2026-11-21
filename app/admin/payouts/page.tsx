import { Banknote, CalendarDays, Users, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import {
  formatAddisDate,
  getDuePayouts,
  payoutCutoff,
  payoutDay,
  PAYOUT_MIN_BIRR,
} from "@/lib/commission/payouts";
import { PayoutsClient } from "./payouts-client";
import { requireAdminPage } from "@/lib/auth-helpers";

// Friday payouts (progress-tracker 2026-11-11). The due list is live —
// it's exactly what "Mark paid" and the Excel export use.
export default async function AdminPayoutsPage() {
  await requireAdminPage();
  const cutoff = payoutCutoff();
  const friday = payoutDay(cutoff);

  const [due, recent, pendingAgg] = await Promise.all([
    getDuePayouts(cutoff),
    prisma.payout.findMany({
      orderBy: { paidAt: "desc" },
      take: 20,
      select: {
        id: true,
        amountBirr: true,
        paidAt: true,
        payoutMethod: true,
        creator: {
          select: { email: true, name: true, creatorDisplayName: true },
        },
        _count: { select: { commissions: true } },
      },
    }),
    prisma.commission.aggregate({
      where: { status: "PENDING" },
      _sum: { amountBirr: true },
    }),
  ]);

  const dueTotal = due.reduce((sum, row) => sum + row.amountBirr, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Payouts"
        description={`Every Friday. Covers commissions pending by Thursday 11:59 PM, for creators with at least ${PAYOUT_MIN_BIRR} Birr.`}
        breadcrumbs={[{ label: "Payouts" }]}
      />
      <KpiStrip
        items={[
          {
            label: "Payout day",
            value: formatAddisDate(friday),
            icon: CalendarDays,
            accent: "teal",
            caption: `Cutoff ${formatAddisDate(cutoff)}, 11:59 PM`,
          },
          {
            label: "Creators due",
            value: due.length.toLocaleString("en-US"),
            icon: Users,
            accent: "orange",
            caption: `At least ${PAYOUT_MIN_BIRR} ETB each`,
          },
          {
            label: "Total due",
            value: `${dueTotal.toLocaleString("en-US")} ETB`,
            icon: Banknote,
            accent: "mint",
            caption: "Not yet marked paid",
          },
          {
            label: "All pending",
            value: `${(pendingAgg._sum.amountBirr ?? 0).toLocaleString("en-US")} ETB`,
            icon: Wallet,
            accent: "coral",
            caption: "Includes amounts rolling over",
          },
        ]}
      />
      <PayoutsClient
        cutoff={cutoff.toISOString()}
        due={due}
        recent={recent.map((payout) => ({
          id: payout.id,
          amountBirr: payout.amountBirr,
          paidAt: formatAddisDate(payout.paidAt),
          payoutMethod: payout.payoutMethod,
          commissionCount: payout._count.commissions,
          creatorName:
            payout.creator.creatorDisplayName ||
            payout.creator.name ||
            payout.creator.email,
        }))}
      />
    </div>
  );
}
