import Link from "next/link";
import { BadgeCheck, Clock, Wallet, type LucideIcon } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { WithdrawalForm } from "./withdrawal-form";
import { EarningsHistory, type HistoryItem } from "./earnings-history";

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE ETB",
};

// Palette for the "Earnings by product" bars.
const BAR_COLORS = [
  "#00a389", // teal-600
  "#2f6fed", // blue-700
  "#f5a524", // orange-500
  "#3bb273", // mint-500
  "#f14c4c", // coral-500
];

function birr(amount: number) {
  return `${amount.toLocaleString()} ETB`;
}

function SummaryCard({
  icon: Icon,
  title,
  subtitle,
  caption,
  value,
  tile,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  caption: string;
  value: string;
  tile: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-8 rounded-[16px] border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${tile}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-foreground">{title}</p>
          <p className="text-xs text-ink-600">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs text-ink-400">{caption}</span>
        <span className="text-[18px] font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}

export default async function CreatorEarningsPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const [commissions, withdrawals, user] = await Promise.all([
    prisma.commission.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amountBirr: true,
        status: true,
        createdAt: true,
        paidAt: true,
        order: { select: { id: true, product: { select: { name: true } } } },
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
        payoutMethod: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        payoutMethod: true,
        payoutAccountName: true,
        payoutAccountNumber: true,
        payoutBankName: true,
      },
    }),
  ]);

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

  // Earnings by product (top 5), with share of total earned.
  const byProduct = new Map<string, number>();
  for (const c of commissions) {
    const name = c.order.product.name;
    byProduct.set(name, (byProduct.get(name) ?? 0) + c.amountBirr);
  }
  const topProducts = [...byProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], index) => ({
      name,
      value,
      percent: totalEarned > 0 ? Math.round((value / totalEarned) * 100) : 0,
      color: BAR_COLORS[index % BAR_COLORS.length],
    }));

  // Combined history: commissions in (+), withdrawals out (−).
  const history: HistoryItem[] = [
    ...commissions.map((c) => ({
      id: `c-${c.id}`,
      kind: "COMMISSION" as const,
      title: c.order.product.name,
      subtitle: c.status === "PAID" ? "Commission paid" : "Commission earned",
      status: c.status,
      at: c.status === "PAID" && c.paidAt ? c.paidAt : c.createdAt,
      amountBirr: c.amountBirr,
      direction: "in" as const,
      orderId: c.order.id,
    })),
    ...withdrawals.map((w) => ({
      id: `w-${w.id}`,
      kind: "WITHDRAWAL" as const,
      title: "Withdrawal",
      subtitle: `Payout · ${PAYOUT_METHOD_LABELS[w.payoutMethod] ?? w.payoutMethod}`,
      status: w.status,
      at: w.decidedAt ?? w.createdAt,
      amountBirr: w.amountBirr,
      direction:
        w.status === "APPROVED"
          ? ("out" as const)
          : ("neutral" as const),
      orderId: null,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const payoutMethodLabel = user?.payoutMethod
    ? PAYOUT_METHOD_LABELS[user.payoutMethod] ?? user.payoutMethod
    : null;
  const maskedAccount = user?.payoutAccountNumber
    ? `•••• •••• ${user.payoutAccountNumber.slice(-4)}`
    : "No payout account yet";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Earnings"
        description="Track your commissions and request withdrawals."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Balance card */}
          <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-ink-900 to-teal-700 p-5 text-white shadow-card">
            <div className="flex items-start justify-between">
              <span className="text-xs text-white/70">Available to withdraw</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <Wallet className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-[28px] leading-tight font-bold">
              {birr(availableBalance)}
            </p>
            <p className="mt-5 text-sm tracking-[0.2em] text-white/85">
              {maskedAccount}
            </p>
            <div className="mt-1.5 flex items-center justify-between text-xs text-white/70">
              <span>{payoutMethodLabel ?? "Set a payout method"}</span>
              <span className="truncate pl-2">
                {user?.payoutAccountName ?? ""}
              </span>
            </div>
          </div>

          {/* Withdraw */}
          <section className="overflow-hidden rounded-[16px] border border-border bg-card shadow-card">
            <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-[15px] font-bold text-foreground">
                  Withdraw
                </h2>
                <p className="text-xs text-ink-400">Needs admin approval</p>
              </div>
              <Link
                href="/creator/settings"
                className="text-xs font-medium text-teal-700"
              >
                Payout details
              </Link>
            </header>
            <div className="p-5">
              <WithdrawalForm
                availableBirr={availableBalance}
                payoutMethod={user?.payoutMethod ?? null}
                hasPayoutMethod={Boolean(user?.payoutAccountNumber)}
              />
            </div>
          </section>

          {/* Earnings by product */}
          <section className="rounded-[16px] border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-foreground">
                Earnings by product
              </h2>
              <span className="text-[15px] font-bold text-foreground">
                {birr(totalEarned)}
              </span>
            </div>
            {topProducts.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-4">
                {topProducts.map((product) => (
                  <li key={product.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: product.color }}
                        />
                        <span className="truncate text-foreground">
                          {product.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-ink-600">
                        {product.percent}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-100">
                        <div
                          className="h-full rounded-pill"
                          style={{
                            width: `${product.percent}%`,
                            backgroundColor: product.color,
                          }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-ink-400">
                        {birr(product.value)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No commissions earned yet.
              </p>
            )}
          </section>
        </div>

        {/* Main column */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={Wallet}
              title="Total earned"
              subtitle="Pending + paid"
              caption="All time"
              value={birr(totalEarned)}
              tile="bg-teal-600 text-white"
            />
            <SummaryCard
              icon={Clock}
              title="Pending payout"
              subtitle="Not yet payable"
              caption="Awaiting"
              value={birr(pendingBirr)}
              tile="bg-orange-500 text-white"
            />
            <SummaryCard
              icon={BadgeCheck}
              title="Paid out"
              subtitle="Paid to you"
              caption="Paid"
              value={birr(paidBirr)}
              tile="bg-mint-500 text-white"
            />
          </div>

          <EarningsHistory items={history} />
        </div>
      </div>
    </div>
  );
}
