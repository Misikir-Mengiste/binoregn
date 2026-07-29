import { prisma } from "@/lib/prisma";

// Shared by GET /api/admin/dashboard/summary and the admin
// Overview page's server component — one place for this
// aggregation instead of duplicating it (code-standards.md:
// server components fetch reads directly via Prisma, but that
// doesn't mean re-deriving the same query twice).
export async function getAdminDashboardSummary() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pendingAgg, paidThisMonthAgg, pendingApplicationCount] =
    await Promise.all([
      prisma.commission.aggregate({
        where: { status: "PENDING" },
        _sum: { amountBirr: true },
      }),
      prisma.commission.aggregate({
        where: { status: "PAID", paidAt: { gte: startOfMonth } },
        _sum: { amountBirr: true },
      }),
      prisma.application.count({ where: { status: "PENDING" } }),
    ]);

  return {
    pendingCommissionBirr: pendingAgg._sum.amountBirr ?? 0,
    paidThisMonthBirr: paidThisMonthAgg._sum.amountBirr ?? 0,
    pendingApplicationCount,
  };
}

export type PeriodTotals = {
  weekly: number;
  monthly: number;
  yearly: number;
  lifetime: number;
};

// Trailing windows (last 7 / 30 / 365 days) rather than calendar
// week/month/year — matches the "last 365 days" framing already used
// by the KPI strip captions above, and avoids a sparse "0" on day 1
// of a new calendar month/year.
function bucketByDate<T>(
  rows: T[],
  getDate: (row: T) => Date | null,
  getValue: (row: T) => number,
): PeriodTotals {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * day;
  const monthAgo = now - 30 * day;
  const yearAgo = now - 365 * day;

  const totals: PeriodTotals = { weekly: 0, monthly: 0, yearly: 0, lifetime: 0 };
  for (const row of rows) {
    const value = getValue(row);
    totals.lifetime += value;
    const date = getDate(row);
    if (!date) continue;
    const time = date.getTime();
    if (time >= yearAgo) totals.yearly += value;
    if (time >= monthAgo) totals.monthly += value;
    if (time >= weekAgo) totals.weekly += value;
  }
  return totals;
}

/**
 * GMV (delivered order value) and total commission paid, each bucketed
 * into weekly/monthly/yearly/lifetime totals, for the admin Overview
 * page. GMV is scoped to delivered orders — the same point at which a
 * Commission row is created (see the CommissionStatus comment in
 * schema.prisma) — so the two figures describe the same set of
 * completed sales rather than including still-open orders.
 */
export async function getGmvAndCommissionSummary(): Promise<{
  gmv: PeriodTotals;
  commissionPaid: PeriodTotals;
}> {
  const [deliveredOrders, paidCommissions] = await Promise.all([
    prisma.order.findMany({
      where: { deliveryStatus: "DELIVERED", deletedAt: null },
      select: {
        createdAt: true,
        quantity: true,
        product: { select: { priceBirr: true } },
      },
    }),
    prisma.commission.findMany({
      where: { status: "PAID", deletedAt: null },
      select: { paidAt: true, amountBirr: true },
    }),
  ]);

  return {
    gmv: bucketByDate(
      deliveredOrders,
      (order) => order.createdAt,
      (order) => order.product.priceBirr * order.quantity,
    ),
    commissionPaid: bucketByDate(
      paidCommissions,
      (commission) => commission.paidAt,
      (commission) => commission.amountBirr,
    ),
  };
}
