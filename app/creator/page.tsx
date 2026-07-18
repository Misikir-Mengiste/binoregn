import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { InitialsAvatar } from "@/components/initials-avatar";

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
    <div className={`flex flex-col gap-1 rounded-lg p-5 ${bg}`}>
      <p className="text-[14px] font-bold text-foreground">{value}</p>
      <p className="text-xs text-ink-600">{label}</p>
    </div>
  );
}

function ProductPreviewCard({
  product,
}: {
  product: { id: string; name: string; priceBirr: number; imageUrls: string[] };
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-card p-3 shadow-card">
      {product.imageUrls[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrls[0]}
          alt=""
          className="h-24 w-full rounded-sm object-cover"
        />
      ) : (
        <div className="h-24 w-full rounded-sm bg-gradient-to-br from-violet-100 to-pink-100" />
      )}
      <p className="text-[13.5px] font-semibold text-foreground">
        {product.name}
      </p>
      <p className="text-xs text-ink-600">{product.priceBirr} Birr</p>
    </div>
  );
}

function ActivityBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-600">{label}</span>
        <span className="font-semibold text-foreground">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-muted">
        <div
          className="h-full rounded-pill bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function pct(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 100);
}

export default async function CreatorOverviewPage() {
  const session = await auth();
  const creatorId = session!.user.id;
  const email = session?.user?.email ?? "";
  const displayName = email.split("@")[0] || "there";

  const [
    products,
    approvedLinksCount,
    recentPayouts,
    totalApplications,
    approvedApplications,
    pendingCommissionAgg,
    paidCommissionAgg,
  ] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.affiliateLink.count({ where: { creatorId } }),
    prisma.commission.findMany({
      where: { creatorId, status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 3,
      select: {
        id: true,
        amountBirr: true,
        paidAt: true,
        order: { select: { product: { select: { name: true } } } },
      },
    }),
    prisma.application.count({ where: { creatorId } }),
    prisma.application.count({ where: { creatorId, status: "APPROVED" } }),
    prisma.commission.aggregate({
      where: { creatorId, status: "PENDING" },
      _sum: { amountBirr: true },
    }),
    prisma.commission.aggregate({
      where: { creatorId, status: "PAID" },
      _sum: { amountBirr: true },
    }),
  ]);

  const pendingBirr = pendingCommissionAgg._sum.amountBirr ?? 0;
  const paidBirr = paidCommissionAgg._sum.amountBirr ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">👋 Hi, {displayName}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          value={`${pendingBirr} Birr`}
          label="Pending earnings"
          bg="bg-peach-100"
        />
        <SummaryCard value={`${paidBirr} Birr`} label="Paid earnings" bg="bg-mint-100" />
        <SummaryCard
          value={String(approvedLinksCount)}
          label="Active affiliate links"
          bg="bg-pink-100"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">
                Browse products
              </h2>
              <Link
                href="/creator/products"
                className="text-xs font-medium text-primary"
              >
                View all
              </Link>
            </div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {products.map((product) => (
                  <ProductPreviewCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No products available yet.
              </p>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-md bg-card p-4 shadow-card">
            <InitialsAvatar email={email} />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-foreground">
                {email}
              </p>
              <p className="text-xs text-ink-600">Creator</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 p-5 text-white">
            <p className="text-xs opacity-80">Pending earnings</p>
            <p className="text-2xl font-bold">{pendingBirr} Birr</p>
            <div className="h-1.5 w-full overflow-hidden rounded-pill bg-white/25">
              <div
                className="h-full rounded-pill bg-white"
                style={{ width: `${pct(paidBirr, pendingBirr + paidBirr)}%` }}
              />
            </div>
            <p className="text-xs opacity-80">{paidBirr} Birr paid so far</p>
          </div>

          <div className="flex flex-col gap-3 rounded-md bg-card p-4 shadow-card">
            <h2 className="text-sm font-bold text-foreground">
              Recent payouts
            </h2>
            {recentPayouts.length > 0 ? (
              recentPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-[13.5px] font-medium text-foreground">
                      {payout.order.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payout.paidAt
                        ? new Date(payout.paidAt).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <p className="text-[13.5px] font-semibold text-mint-500">
                    +{payout.amountBirr} Birr
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payouts yet.</p>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-md bg-card p-4 shadow-card">
            <h2 className="text-sm font-bold text-foreground">Activity</h2>
            <ActivityBar
              label="Applications approved"
              percent={pct(approvedApplications, totalApplications)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
