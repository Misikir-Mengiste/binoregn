import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Wallet,
  Clock,
  BadgeCheck,
  PiggyBank,
  TrendingUp,
  ShoppingBag,
  Link2,
  FileText,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  formatAddisDate,
  payoutCutoff,
  PAYOUT_MIN_BIRR,
} from "@/lib/commission/payouts";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/kpi-strip";
import { StatusBadge } from "@/components/status-badge";
import { InitialsAvatar } from "@/components/initials-avatar";
import { CreatorApproveButton } from "./creator-approve-button";
import { CreatorDeactivateButton } from "./creator-deactivate-button";
import { shortProductName } from "@/lib/short-name";
import { formatDate } from "@/lib/format";
import { orderTotalBirr } from "@/lib/discount";
import { requireAdminPage } from "@/lib/auth-helpers";
import { profileLinkHref } from "@/lib/profile-link";
import { isWalletMethod, payoutProvider } from "@/lib/payout-display";

function birr(amount: number) {
  return `${amount.toLocaleString("en-US")} ETB`;
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
  await requireAdminPage();
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
      isActive: true,
    },
  });

  if (!creator || creator.role !== "CREATOR") {
    notFound();
  }

  const [commissions, payouts, applications, links, orders] =
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
      prisma.payout.findMany({
        where: { creatorId: id },
        orderBy: { paidAt: "desc" },
        select: {
          id: true,
          amountBirr: true,
          paidAt: true,
          payoutMethod: true,
          payoutBankName: true,
          _count: { select: { commissions: true } },
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
          discountBirr: true,
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
  // What the current Friday payout covers for them (lib/commission/payouts.ts);
  // it is only paid out once it reaches PAYOUT_MIN_BIRR.
  const cutoff = payoutCutoff();
  const dueBirr = commissions
    .filter((c) => c.status === "PENDING" && c.createdAt <= cutoff)
    .reduce((sum, c) => sum + c.amountBirr, 0);

  // Revenue driven — order value attributed to this creator.
  const revenueBirr = orders.reduce(
    (sum, o) =>
      sum +
      orderTotalBirr({ priceBirr: o.product.priceBirr, quantity: o.quantity, discountBirr: o.discountBirr }),
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
          {!creator.isActive ? (
            <span className="rounded-pill bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              Deactivated
            </span>
          ) : creator.creatorProfileStatus ? (
            <StatusBadge status={creator.creatorProfileStatus} />
          ) : (
            <span className="text-xs text-ink-400">Onboarding incomplete</span>
          )}
          {!isApproved && creator.creatorOnboardingCompletedAt ? (
            <CreatorApproveButton
              creatorId={creator.id}
              canReject={creator.creatorProfileStatus !== "REJECTED"}
            />
          ) : null}
          <CreatorDeactivateButton
            creatorId={creator.id}
            isActive={creator.isActive}
          />
        </div>
      </div>

      {/* Earnings */}
      <KpiStrip
        items={[
          {
            label: "Total earned",
            value: birr(totalEarned),
            icon: Wallet,
            accent: "teal",
            caption: "Pending + paid commissions",
          },
          {
            label: "Pending",
            value: birr(pendingBirr),
            icon: Clock,
            accent: "orange",
            caption: "Commissions awaiting payout",
          },
          {
            label: "Paid",
            value: birr(paidBirr),
            icon: BadgeCheck,
            accent: "mint",
            caption: "Commissions marked paid",
          },
          {
            label: "Due this Friday",
            value: birr(dueBirr),
            icon: PiggyBank,
            accent: "teal",
            caption:
              dueBirr >= PAYOUT_MIN_BIRR
                ? "Included in the Friday payout"
                : `Rolls over until it reaches ${PAYOUT_MIN_BIRR} Birr`,
          },
        ]}
      />

      {/* Revenue + activity */}
      <KpiStrip
        items={[
          {
            label: "Revenue driven",
            value: birr(revenueBirr),
            icon: TrendingUp,
            accent: "teal",
            caption: "Order value from their links",
          },
          {
            label: "Orders",
            value: orders.length.toLocaleString("en-US"),
            icon: ShoppingBag,
            accent: "orange",
            caption: `${deliveredCount.toLocaleString("en-US")} delivered`,
          },
          {
            label: "Active links",
            value: links.length.toLocaleString("en-US"),
            icon: Link2,
            accent: "mint",
            caption: "Approved affiliate links",
          },
          {
            label: "Applications",
            value: applications.length.toLocaleString("en-US"),
            icon: FileText,
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
              label="Profile link"
              value={
                creator.creatorProfileUrl ? (
                  profileLinkHref(creator.creatorProfileUrl) ? (
                    <a
                      href={profileLinkHref(creator.creatorProfileUrl)!}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 underline"
                    >
                      {creator.creatorProfileUrl}
                    </a>
                  ) : (
                    creator.creatorProfileUrl
                  )
                ) : null
              }
            />
            <InfoRow label="Category" value={creator.creatorCategory} />
            <InfoRow
              label="Joined"
              value={formatDate(creator.createdAt)}
            />
            <InfoRow
              label="Onboarding completed"
              value={
                creator.creatorOnboardingCompletedAt
                  ? formatDate(creator.creatorOnboardingCompletedAt,)
                  : null
              }
            />
          </div>
        </Section>

        <Section title="Payout details">
          <div className="divide-y divide-border">
            <InfoRow
              label="Method"
              value={payoutProvider(creator)}
            />
            <InfoRow label="Account name" value={creator.payoutAccountName} />
            <InfoRow
              label={isWalletMethod(creator.payoutMethod) ? "Phone number" : "Account number"}
              value={creator.payoutAccountNumber}
            />
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
                    <span title={application.product.name}>{shortProductName(application.product.name)}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {formatDate(application.createdAt)}
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
                      <span title={link.product.name}>{shortProductName(link.product.name)}</span>
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {link.viewCount.toLocaleString("en-US")}
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {(stats?.orders ?? 0).toLocaleString("en-US")}
                    </td>
                    <td className="px-5 py-3 text-ink-600">
                      {(stats?.delivered ?? 0).toLocaleString("en-US")}
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
                    <span title={commission.order.product.name}>{shortProductName(commission.order.product.name)}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {birr(commission.amountBirr)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={commission.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {formatDate(commission.createdAt)}
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

      {/* Friday payouts */}
      <Section title="Payouts">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="bg-surface-100 text-xs text-ink-400">
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Commissions</th>
                <th className="px-5 py-3 font-medium">Paid on</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium text-foreground">
                    {birr(payout.amountBirr)}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {payoutProvider(payout) ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {payout._count.commissions.toLocaleString("en-US")}
                  </td>
                  <td className="px-5 py-3 text-ink-600">
                    {formatAddisDate(payout.paidAt)}
                  </td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    No payouts yet.
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
