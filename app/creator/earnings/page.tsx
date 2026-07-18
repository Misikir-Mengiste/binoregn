import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { PayoutMethodForm } from "./payout-method-form";

function SummaryCard({
  value,
  label,
  bg,
}: {
  value: string;
  label: string;
  bg: string;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-[10px] p-5 ${bg}`}>
      <p className="text-[14px] font-bold text-foreground">{value}</p>
      <p className="text-xs text-ink-600">{label}</p>
    </div>
  );
}

export default async function CreatorEarningsPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const [commissions, user] = await Promise.all([
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Earnings"
        description="Track your commissions and set up how you get paid."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          value={`${pendingBirr} Birr`}
          label="Pending"
          bg="bg-peach-100"
        />
        <SummaryCard value={`${paidBirr} Birr`} label="Paid" bg="bg-mint-100" />
      </div>

      <section className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <header className="border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-bold text-foreground">
            Payout method
          </h2>
          <p className="text-xs text-ink-400">
            Where admin sends your commission when it's marked paid — this
            platform pays out manually, not through an automated payment
            gateway.
          </p>
        </header>
        <div className="p-5">
          <PayoutMethodForm initial={user ?? { payoutMethod: null, payoutAccountName: null, payoutAccountNumber: null, payoutBankName: null }} />
        </div>
      </section>

      <div className="flex flex-col gap-3">
        {commissions.map((commission) => (
          <div
            key={commission.id}
            className="flex items-center justify-between rounded-[10px] border border-border bg-card p-4"
          >
            <div>
              <p className="text-[13.5px] font-semibold text-foreground">
                {commission.order.product.name} — {commission.amountBirr} Birr
              </p>
              <p className="text-xs text-ink-600">
                {commission.status === "PAID" && commission.paidAt
                  ? `Paid ${new Date(commission.paidAt).toLocaleDateString()}`
                  : `Earned ${new Date(commission.createdAt).toLocaleDateString()}`}
              </p>
            </div>
            <StatusBadge status={commission.status} />
          </div>
        ))}
        {commissions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No earnings yet — commissions appear here once a referred order is
            delivered and its cash is reconciled.
          </p>
        )}
      </div>
    </div>
  );
}
