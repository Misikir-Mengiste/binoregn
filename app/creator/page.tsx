import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  Eye,
  Link2,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

// Brand palette (globals.css) for the earnings-breakdown donut.
const DONUT_PALETTE = [
  "#00a389", // teal-600
  "#2f6fed", // blue-700
  "#f14c4c", // coral-500
  "#f5a524", // orange-500
  "#3bb273", // mint-500
  "#7c3aed", // violet-600
  "#b8620a", // peach-700
];
const DONUT_OTHER = "#9a97ac"; // ink-400

function birr(amount: number) {
  return `${amount.toLocaleString()} Birr`;
}

// Kept out of the component body so the render stays pure (no Date.now()).
function earnedInLastDays(
  commissions: { amountBirr: number; createdAt: Date }[],
  days: number,
) {
  const cutoff = Date.now() - days * 86_400_000;
  return commissions
    .filter((c) => c.createdAt.getTime() >= cutoff)
    .reduce((sum, c) => sum + c.amountBirr, 0);
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 shadow-card">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${tint}`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div>
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-[19px] font-bold tracking-tight text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

type Segment = { label: string; value: number; color: string };

function DonutChart({
  segments,
  total,
}: {
  segments: Segment[];
  total: number;
}) {
  const size = 190;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  let offset = 0;

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${center} ${center})`}>
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#eef2f1"
            strokeWidth={stroke}
          />
          {total > 0 &&
            segments.map((segment) => {
              const length = (segment.value / total) * c;
              const dash = (
                <circle
                  key={segment.label}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${length} ${c - length}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return dash;
            })}
        </g>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[11px] text-ink-400">Total earned</span>
        <span className="text-xl font-bold text-foreground">
          {total.toLocaleString()}
        </span>
        <span className="text-[11px] text-ink-400">Birr</span>
      </div>
    </div>
  );
}

export default async function CreatorOverviewPage() {
  const session = await auth();
  const creatorId = session!.user.id;
  const email = session?.user?.email ?? "";
  const fallbackName = email.split("@")[0] || "there";

  const [user, commissions, withdrawals, links, ordersCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: creatorId },
        select: {
          creatorDisplayName: true,
          creatorUsername: true,
          payoutMethod: true,
          payoutAccountNumber: true,
        },
      }),
      prisma.commission.findMany({
        where: { creatorId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountBirr: true,
          status: true,
          createdAt: true,
          paidAt: true,
          order: { select: { product: { select: { name: true } } } },
        },
      }),
      prisma.withdrawal.findMany({
        where: { creatorId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountBirr: true,
          status: true,
          createdAt: true,
          decidedAt: true,
        },
      }),
      prisma.affiliateLink.findMany({
        where: { creatorId },
        select: { id: true, viewCount: true },
      }),
      prisma.order.count({ where: { creatorId } }),
    ]);

  const displayName =
    user?.creatorDisplayName || user?.creatorUsername || fallbackName;

  // Earnings math (same as the earnings page).
  const pendingBirr = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.amountBirr, 0);
  const paidBirr = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.amountBirr, 0);
  const totalEarned = pendingBirr + paidBirr;
  const withdrawnTotal = withdrawals
    .filter((w) => w.status !== "REJECTED")
    .reduce((sum, w) => sum + w.amountBirr, 0);
  const availableBalance = Math.max(paidBirr - withdrawnTotal, 0);

  const totalViews = links.reduce((sum, link) => sum + link.viewCount, 0);

  // Time-bucketed earnings (by commission creation).
  const last7 = earnedInLastDays(commissions, 7);
  const last30 = earnedInLastDays(commissions, 30);

  // Earnings breakdown by product (top 6 + "Other").
  const byProduct = new Map<string, number>();
  for (const c of commissions) {
    const name = c.order.product.name;
    byProduct.set(name, (byProduct.get(name) ?? 0) + c.amountBirr);
  }
  const ranked = [...byProduct.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, DONUT_PALETTE.length);
  const rest = ranked.slice(DONUT_PALETTE.length);
  const segments: Segment[] = top.map(([label, value], i) => ({
    label,
    value,
    color: DONUT_PALETTE[i],
  }));
  if (rest.length > 0) {
    segments.push({
      label: "Other",
      value: rest.reduce((sum, [, value]) => sum + value, 0),
      color: DONUT_OTHER,
    });
  }

  // Combined account activity: commissions in (+), payouts out (−).
  type Activity = {
    id: string;
    label: string;
    kind: string;
    status: string;
    at: Date;
    amount: number;
  };
  const activity: Activity[] = [];
  for (const c of commissions) {
    activity.push({
      id: `c-${c.id}`,
      label: c.order.product.name,
      kind: "Commission",
      status: c.status,
      at: c.status === "PAID" && c.paidAt ? c.paidAt : c.createdAt,
      amount: c.amountBirr,
    });
  }
  for (const w of withdrawals) {
    if (w.status !== "APPROVED") continue;
    activity.push({
      id: `w-${w.id}`,
      label: "Withdrawal to your account",
      kind: "Payout",
      status: "PAID",
      at: w.decidedAt ?? w.createdAt,
      amount: -w.amountBirr,
    });
  }
  activity.sort((a, b) => b.at.getTime() - a.at.getTime());
  const recentActivity = activity.slice(0, 7);

  const maskedAccount = user?.payoutAccountNumber
    ? `•••• ${user.payoutAccountNumber.slice(-4)}`
    : user?.creatorUsername
      ? `@${user.creatorUsername}`
      : email;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">
        👋 Hi, {displayName}
      </h1>

      {/* Row 1: main earnings account + promo */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col justify-between gap-6 rounded-[16px] border border-border bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-ink-400">Creator earnings</p>
              <p className="mt-1 text-lg font-bold text-foreground">
                {displayName}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
                {maskedAccount}
                <ArrowRight className="h-3.5 w-3.5 text-teal-600" />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-400">Available to withdraw</p>
              <p className="text-[30px] leading-tight font-bold tracking-tight text-foreground">
                {availableBalance.toLocaleString()}
                <span className="ml-1 text-base font-semibold text-ink-400">
                  Birr
                </span>
              </p>
              <p className="text-xs text-ink-400">
                {birr(totalEarned)} earned all-time
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/creator/earnings"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Request withdrawal
            </Link>
            <Link
              href="/creator/settings"
              className="inline-flex h-10 items-center justify-center rounded-[10px] border border-border bg-surface-100 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-card"
            >
              Payout details
            </Link>
          </div>
        </div>

        <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-[16px] bg-gradient-to-br from-teal-700 to-teal-500 p-6 text-white shadow-card">
          <Sparkles className="absolute -top-3 -right-3 h-24 w-24 text-white/10" />
          <div className="relative">
            <p className="text-base font-bold">Grow your earnings</p>
            <p className="mt-2 text-sm text-white/85">
              Apply to more products and share your affiliate links — you earn a
              fixed commission on every completed order.
            </p>
          </div>
          <Link
            href="/creator/products"
            className="relative inline-flex h-10 w-fit items-center justify-center gap-1.5 rounded-[10px] bg-white px-4 text-sm font-semibold text-teal-700 transition-colors hover:bg-white/90"
          >
            Browse products
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Row 2: KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={Wallet}
          label="Lifetime earnings"
          value={birr(totalEarned)}
          tint="bg-teal-600 text-white"
        />
        <StatCard
          icon={Clock}
          label="Pending earnings"
          value={birr(pendingBirr)}
          tint="bg-peach-100 text-peach-700"
        />
        <StatCard
          icon={BadgeCheck}
          label="Paid earnings"
          value={birr(paidBirr)}
          tint="bg-mint-100 text-mint-500"
        />
        <StatCard
          icon={Link2}
          label="Active links"
          value={links.length.toLocaleString()}
          tint="bg-teal-100 text-teal-700"
        />
        <StatCard
          icon={Eye}
          label="Link views"
          value={totalViews.toLocaleString()}
          tint="bg-blue-100 text-blue-700"
        />
      </div>

      {/* Row 3: activity + earnings breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Latest activity */}
        <div className="flex flex-col overflow-hidden rounded-[16px] border border-border bg-card shadow-card">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-base font-bold text-foreground">
              Latest activity
            </h2>
            <Link
              href="/creator/earnings"
              className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-teal-600 text-white transition-colors hover:bg-teal-700"
              aria-label="View earnings"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentActivity.length > 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-ink-400">
                      {item.kind} · {new Date(item.at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span
                      className={`text-[13.5px] font-semibold ${
                        item.amount >= 0 ? "text-mint-500" : "text-foreground"
                      }`}
                    >
                      {item.amount >= 0 ? "+" : "−"}
                      {Math.abs(item.amount).toLocaleString()} Birr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No activity yet — commissions and payouts show up here.
            </p>
          )}
        </div>

        {/* Earnings breakdown */}
        <div className="flex flex-col gap-5 rounded-[16px] border border-border bg-card p-5 shadow-card">
          <h2 className="text-base font-bold text-foreground">
            Earnings breakdown
          </h2>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Last 7 days", value: last7 },
              { label: "Last 30 days", value: last30 },
              { label: "All time", value: totalEarned },
            ].map((bucket) => (
              <div key={bucket.label} className="rounded-[10px] bg-surface-100 p-3">
                <p className="text-xs text-ink-400">{bucket.label}</p>
                <p className="text-sm font-bold text-foreground">
                  {birr(bucket.value)}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <DonutChart segments={segments} total={totalEarned} />
            <div className="flex-1">
              {segments.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {segments.map((segment) => (
                    <li
                      key={segment.label}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="truncate text-ink-600">
                          {segment.label}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-foreground">
                        {birr(segment.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No commissions earned yet. Your earnings by product will
                  appear here.
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-ink-400">
            Based on {commissions.length.toLocaleString()} commission
            {commissions.length === 1 ? "" : "s"} across {ordersCount.toLocaleString()}{" "}
            referred order{ordersCount === 1 ? "" : "s"}.
          </p>
        </div>
      </div>
    </div>
  );
}
