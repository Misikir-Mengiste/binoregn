import { Clock, Hash, BadgeCheck, CalendarCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { CommissionsClient } from "./commissions-client";
import { requireAdminPage } from "@/lib/auth-helpers";

export default async function AdminCommissionsPage() {
  await requireAdminPage();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [commissions, pendingAgg, paidAgg, paidThisMonthAgg] =
    await Promise.all([
      prisma.commission.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountBirr: true,
          status: true,
          createdAt: true,
          paidAt: true,
          creator: {
            select: {
              email: true,
              name: true,
              payoutMethod: true,
              payoutAccountName: true,
              payoutAccountNumber: true,
              payoutBankName: true,
            },
          },
          order: { select: { id: true, product: { select: { name: true } } } },
        },
      }),
      prisma.commission.aggregate({
        where: { status: "PENDING" },
        _sum: { amountBirr: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { status: "PAID" },
        _sum: { amountBirr: true },
        _count: true,
      }),
      prisma.commission.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amountBirr: true },
      }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Commissions"
        description="Track pending and paid creator commissions."
        breadcrumbs={[{ label: "Commissions" }]}
        showMoreActions
      />
      <KpiStrip
        items={[
          {
            label: "Pending total",
            value: `${pendingAgg._sum.amountBirr ?? 0} ETB`,
            icon: Clock,
            accent: "orange",
          },
          {
            label: "Pending count",
            value: pendingAgg._count.toLocaleString("en-US"),
            icon: Hash,
            accent: "teal",
          },
          {
            label: "Paid total",
            value: `${paidAgg._sum.amountBirr ?? 0} ETB`,
            icon: BadgeCheck,
            accent: "mint",
          },
          {
            label: "Paid this month",
            value: `${paidThisMonthAgg._sum.amountBirr ?? 0} ETB`,
            icon: CalendarCheck,
            accent: "coral",
          },
        ]}
      />
      <CommissionsClient commissions={commissions} />
    </div>
  );
}
