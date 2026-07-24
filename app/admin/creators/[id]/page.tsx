import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { StatusBadge } from "@/components/status-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { CreatorApproveButton } from "./creator-approve-button";

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE ETB",
};

function birr(amount: number) {
  return `${amount.toLocaleString()} ETB`;
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export default async function AdminCreatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const creator = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
      createdAt: true,
      creatorUsername: true,
      creatorPhone: true,
      creatorDisplayName: true,
      creatorPlatform: true,
      creatorProfileUrl: true,
      creatorCategory: true,
      creatorProfileStatus: true,
      creatorOnboardingCompletedAt: true,
      payoutMethod: true,
      payoutAccountName: true,
      payoutAccountNumber: true,
      payoutBankName: true,
    },
  });

  if (!creator || creator.role !== "CREATOR") {
    notFound();
  }

  const [commissions, withdrawals, applications, links, orders] =
    await Promise.all([
      prisma.commission.findMany({
        where: { creatorId: id },
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
        where: { creatorId: id },
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
      prisma.application.findMany({
        where: { creatorId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          product: { select: { name: true, imageUrls: true } },
        },
      }),
      prisma.affiliateLink.findMany({
        where: { creatorId: id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          viewCount: true,
          product: { select: { name: true } },
        },
      }),
      prisma.order.findMany({
        where: { creatorId: id },
        select: {
          id: true,
          quantity: true,
          deliveryStatus: true,
          affiliateLinkId: true,
          product: { select: { priceBirr: true } },
        },
      }),
    ]);

  // Earnings — same math as the creator's own earnings page.
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

  // Revenue driven — order value attributed to this creator.
  const revenueBirr = orders.reduce(
    (sum, o) => sum + o.product.priceBirr * o.quantity,
    0,
  );
  const deliveredCount = orders.filter(
    (o) => o.deliveryStatus === "DELIVERED",
  ).length;

  // Per-link order + delivered counts (Order stores deliveryStatus, not the link).
  const linkStats = new Map<string, { orders: number; delivered: number }>();
  for (const o of orders) {
    const entry = linkStats.get(o.affiliateLinkId) ?? {
      orders: 0,
      delivered: 0,
    };
    entry.orders += 1;
    if (o.deliveryStatus === "DELIVERED") entry.delivered += 1;
    linkStats.set(o.affiliateLinkId, entry);
  }

  const displayName =
    creator.creatorDisplayName || creator.name || creator.email;
  const isApproved = creator.creatorProfileStatus === "APPROVED";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={displayName}
        description="Applicant profile, earnings, and activity."
        breadcrumbs={[
          { label: "Creators", href: "/admin/creators" },
          { label: displayName },
        ]}
      />

      {/* Identity header */}
      <div className="flex flex-col gap-4 rounded-[10px] border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <InitialsAvatar email={creator.email} />
          <div>
            <p className="text-base font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-sm text-ink-400">
              {creator.creatorUsername
                ? `@${creator.creatorUsername} · ${creator.email}`
                : creator.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {creator.creatorProfileStatus ? (
            <StatusBadge status={creator.creatorProfileStatus} />
          ) : (
            <span className="text-xs text-ink-400">Onboarding incomplete</span>
          )}
          {!isApproved && creator.creatorOnboardingCompletedAt ? (
            <CreatorApproveButton creatorId={creator.id} />
          ) : null}
        </div>
      </div>

      {/* Earnings */}
      <KpiStrip
        items={[
          {
            label: "Total earned",
            value: birr(totalEarned),
            accent: "teal",
            caption: "Pending + paid commissions",
          },
          {
            label: "Pending",
            value: birr(pendingBirr),
            accent: "orange",
            caption: "Commissions awaiting payout",
          },
          {
            label: "Paid",
            value: birr(paidBirr),
            accent: "mint",
            caption: "Commissions marked paid",
          },
          {
            label: "Available balance",
            value: birr(availableBalance),
            accent: "teal",
            caption: "Paid minus withdrawals",
          },
        ]}
      />

      {/* Revenue + activity */}
      <KpiStrip
        items={[
          {
            label: "Revenue driven",
            value: birr(revenueBirr),
            accent: "teal",
            caption: "Order value from their links",
          },
          {
            label: "Orders",
            value: orders.length.toLocaleString(),
            accent: "orange",
            caption: `${deliveredCount.toLocaleString()} delivered`,
          },
          {
            label: "Active links",
            value: links.length.toLocaleString(),
            accent: "mint",
            caption: "Approved affiliate links",
          },
          {
            label: "Applications",
            value: applications.length.toLocaleString(),
            accent: "coral",
            caption: "Products applied to",
          },
        ]}
      />

      {/* Profile + payout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Creator information">
          <div className="divide-y divide-border">
            <InfoRow label="Display name" value={creator.creatorDisplayName} />
            <InfoRow
              label="Username"
              value={
                creator.creatorUsername ? `@${creator.creatorUsername}` : null
              }
            />
            <InfoRow label="Email" value={creator.email} />
            <InfoRow label="Phone" value={creator.creatorPhone} />
            <InfoRow label="Platform" value={creator.creatorPlatform} />
            <InfoRow
              label="Profile URL"
              value={
                creator.creatorProfileUrl ? (
                  <a
                    href={creator.creatorProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 underline"
                  >
                    {creator.creatorProfileUrl}
                  </a>
                ) : null
              }
            />
            <InfoRow label="Category" value={creator.creatorCategory} />
            <InfoRow
              label="Joined"
              value={new Date(creator.createdAt).toLocaleDateString()}
            />
            <InfoRow
              label="Onboarding completed"
              value={
                creator.creatorOnboardingCompletedAt
                  ? new Date(
                      creator.creatorOnboardingCompletedAt,
                    ).toLocaleDateString()
                  : null
              }
            />
          </div>
        </Section>

        <Section title="Payout details">
          <div className="divide-y divide-border">
            <InfoRow
              label="Method"
              value={
                creator.payoutMethod
                  ? PAYOUT_METHOD_LABELS[creator.payoutMethod] ??
                    creator.payoutMethod
                  : null
              }
            />
            <InfoRow label="Account name" value={creator.payoutAccountName} />
            <InfoRow
              label="Account number"
              value={creator.payoutAccountNumber}
            />
            <InfoRow label="Bank" value={creator.payoutBankName} />
          </div>
        </Section>
      </div>

      {/* Applications */}
      <Section title="Applications">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Applied</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {application.product.name}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    No applications yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Affiliate links */}
      <Section title="Affiliate links">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Views</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Delivered</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const stats = linkStats.get(link.id);
                return (
                  <tr key={link.id} className="border-t border-border">
                    <td className="px-5 py-3 font-medium text-foreground">
                      {link.product.name}
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {link.viewCount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {(stats?.orders ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {(stats?.delivered ?? 0).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {links.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    No affiliate links yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Commissions */}
      <Section title="Commissions">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {commission.order.product.name}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {birr(commission.amountBirr)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={commission.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {new Date(commission.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    No commissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Withdrawals */}
      <Section title="Withdrawals">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Requested</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {birr(withdrawal.amountBirr)}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {PAYOUT_METHOD_LABELS[withdrawal.payoutMethod] ??
                      withdrawal.payoutMethod}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={withdrawal.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {new Date(withdrawal.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    No withdrawal requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <div>
        <Link
          href="/admin/creators"
          className="text-sm font-medium text-teal-700 underline"
        >
          ← Back to creators
        </Link>
      </div>
    </div>
  );
}
