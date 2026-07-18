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
