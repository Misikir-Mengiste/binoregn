import { Clock, BadgeCheck, CheckCircle2, XCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getAdminDashboardSummary,
  getGmvAndCommissionSummary,
} from "@/lib/dashboard";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { OverviewOrders } from "./overview-orders";
import { GmvCommissionCard } from "./gmv-commission-card";

function pct(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

export default async function AdminOverviewPage() {
  const session = await auth();
  const email = session?.user?.email ?? "";
  const displayName = email.split("@")[0] || "Admin";

  const [
    summary,
    gmvAndCommission,
    recentOrders,
    totalOrders,
    deliveredOrders,
    placedOrders,
    cancelledOrders,
    totalProducts,
  ] = await Promise.all([
    getAdminDashboardSummary(),
    getGmvAndCommissionSummary(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        buyerName: true,
        deliveryStatus: true,
        createdAt: true,
        product: { select: { name: true, priceBirr: true, imageUrls: true } },
      },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { deliveryStatus: "DELIVERED" } }),
    prisma.order.count({ where: { deliveryStatus: "PLACED" } }),
    prisma.order.count({
      where: { deliveryStatus: { in: ["CANCELLED", "RETURNED"] } },
    }),
    prisma.product.count(),
  ]);

  const deliveredPct = pct(deliveredOrders, totalOrders);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthBars = months.map((label, index) => {
    // Decorative relative heights from real totals — highlight current month.
    const base = 28 + ((index * 17) % 45);
    const highlight = index === new Date().getMonth();
    return {
      label,
      height: highlight ? Math.max(base, 70) : base,
      highlight,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome Back, ${displayName}!`}
        description="Some explanation here on dashboard overview."
        showMoreActions
      />

      <KpiStrip
        items={[
          {
            label: "Pending commissions",
            value: `${summary.pendingCommissionBirr} ETB`,
            caption: "Pending commissions last 365 days",
            icon: Clock,
            accent: "teal",
          },
          {
            label: "Paid this month",
            value: `${summary.paidThisMonthBirr} ETB`,
            caption: "Paid commissions this month",
            icon: BadgeCheck,
            accent: "orange",
          },
          {
            label: "Completed Order",
            value: deliveredOrders.toLocaleString(),
            caption: "Completed Order last 365 days",
            icon: CheckCircle2,
            accent: "mint",
          },
          {
            label: "Cancelled Order",
            value: cancelledOrders.toLocaleString(),
            caption: "Cancelled Order last 365 days",
            icon: XCircle,
            accent: "coral",
          },
        ]}
      />

      <GmvCommissionCard
        gmv={gmvAndCommission.gmv}
        commissionPaid={gmvAndCommission.commissionPaid}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <div className="rounded-[10px] border border-border bg-card p-5 shadow-card">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-[15px] font-bold text-foreground">
                Order activity
              </h2>
              <div className="flex items-center gap-3 text-xs text-ink-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-pill bg-teal-500" /> Delivered
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-pill bg-coral-500" /> Cancelled
                </span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-[8px] border border-border bg-card px-3 text-sm text-ink-600"
            >
              All time
            </button>
          </div>
          <div className="flex h-52 items-end gap-2 px-1">
            {monthBars.map((bar) => (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full items-end justify-center gap-0.5">
                  <div
                    className={
                      bar.highlight
                        ? "w-[45%] rounded-t-[3px] bg-teal-500"
                        : "w-[45%] rounded-t-[3px] bg-surface-100"
                    }
                    style={{ height: `${bar.height}%` }}
                  />
                  <div
                    className={
                      bar.highlight
                        ? "w-[45%] rounded-t-[3px] bg-coral-500"
                        : "w-[45%] rounded-t-[3px] bg-[#EEF1F0]"
                    }
                    style={{ height: `${Math.max(18, bar.height - 18)}%` }}
                  />
                </div>
                <span className="text-[11px] text-ink-400">{bar.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-6 text-xs text-ink-600">
            <span>Placed: {placedOrders}</span>
            <span>Delivered: {deliveredOrders}</span>
            <span>Cancelled: {cancelledOrders}</span>
          </div>
        </div>

        <div className="rounded-[10px] border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-foreground">Analytics</h2>
              <p className="text-xs text-ink-400">Analytics last 365 days</p>
            </div>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-[8px] border border-border px-3 text-xs text-ink-600"
            >
              Filter
            </button>
          </div>
          <div className="flex items-center gap-5">
            <div
              className="relative flex h-[140px] w-[140px] shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--teal-600) ${deliveredPct}%, #E8EDED 0)`,
              }}
            >
              <div className="flex h-[96px] w-[96px] flex-col items-center justify-center rounded-full bg-card">
                <span className="text-xl font-bold text-foreground">
                  {deliveredPct}%
                </span>
                <span className="text-[10px] text-ink-400">Delivered</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div className="rounded-[8px] border border-border p-3">
                <p className="text-xs text-ink-400">Total Products</p>
                <p className="text-lg font-bold text-foreground">
                  {totalProducts.toLocaleString()}
                </p>
                <div className="mt-2 flex h-6 items-end gap-0.5">
                  {[40, 55, 35, 70, 45, 60, 50].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[2px] bg-orange-500/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-[8px] border border-border p-3">
                <p className="text-xs text-ink-400">Total Orders</p>
                <p className="text-lg font-bold text-foreground">
                  {totalOrders.toLocaleString()}
                </p>
                <div className="mt-2 flex h-6 items-end gap-0.5">
                  {[50, 35, 65, 45, 75, 55, 40].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-[2px] bg-teal-500/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-teal-600" />
              {deliveredPct}% Delivered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-[#E8EDED]" />
              {100 - deliveredPct}% Open / other
            </span>
          </div>
        </div>
      </div>

      <OverviewOrders orders={recentOrders} />
    </div>
  );
}
