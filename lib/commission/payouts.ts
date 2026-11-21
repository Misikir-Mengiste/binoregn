import { prisma } from "@/lib/prisma";

// Friday payouts (progress-tracker 2026-11-11). The only code that moves
// a commission PENDING → PAID (architecture.md invariant 6 — lives in
// lib/commission).
//
// - A Friday payout covers PENDING commissions created (= the order was
//   marked Delivered) by the most recent Thursday 11:59:59.999 PM in
//   Addis Ababa time.
// - Only creators whose covered total is ≥ PAYOUT_MIN_BIRR are paid;
//   smaller totals stay PENDING and roll into a later Friday.
// - Nothing is stored until admin marks a creator paid: the "due" list
//   is computed live, so it can never drift from the commissions.

export const PAYOUT_MIN_BIRR = 500;

// Ethiopia is UTC+3 all year (no daylight saving).
const ADDIS_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const THURSDAY = 4;

// Most recent Thursday 11:59:59.999 PM (Addis Ababa) at or before `now`.
export function payoutCutoff(now: Date = new Date()) {
  const local = new Date(now.getTime() + ADDIS_OFFSET_MS);
  const daysSinceThursday = (local.getUTCDay() - THURSDAY + 7) % 7;
  const thursdayEndLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() - daysSinceThursday,
    23,
    59,
    59,
    999,
  );
  let cutoff = thursdayEndLocal - ADDIS_OFFSET_MS;
  // On a Thursday before midnight, this Thursday's cutoff hasn't passed.
  if (cutoff > now.getTime()) cutoff -= 7 * DAY_MS;
  return new Date(cutoff);
}

// The cutoff after `cutoff` — what the creator's next payout will cover.
export function nextPayoutCutoff(now: Date = new Date()) {
  return new Date(payoutCutoff(now).getTime() + 7 * DAY_MS);
}

// The Friday a cutoff belongs to (the instant right after it).
export function payoutDay(cutoff: Date) {
  return new Date(cutoff.getTime() + 1);
}

// For creators: the cutoff of the Friday that is today or still ahead.
// On a Friday that's the cutoff that just passed; any other day it's the
// coming Thursday's — so a creator never sees a payout date in the past
// (admin's page keeps the latest passed cutoff, which is what's payable).
export function upcomingPayoutCutoff(now: Date = new Date()) {
  const latest = payoutCutoff(now);
  const sameAddisDay = (a: Date, b: Date) =>
    new Date(a.getTime() + ADDIS_OFFSET_MS).toISOString().slice(0, 10) ===
    new Date(b.getTime() + ADDIS_OFFSET_MS).toISOString().slice(0, 10);
  return sameAddisDay(payoutDay(latest), now) ? latest : nextPayoutCutoff(now);
}

export function formatAddisDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Addis_Ababa",
  });
}

function dueWhere(cutoff: Date, creatorId?: string) {
  return {
    status: "PENDING" as const,
    payoutId: null,
    createdAt: { lte: cutoff },
    ...(creatorId ? { creatorId } : {}),
  };
}

export type DuePayout = {
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  creatorPhone: string | null;
  amountBirr: number;
  commissionCount: number;
  payoutMethod: string | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
  payoutBankName: string | null;
};

// Creators owed money for the given cutoff (≥ minimum), largest first.
export async function getDuePayouts(cutoff: Date = payoutCutoff()) {
  const groups = await prisma.commission.groupBy({
    by: ["creatorId"],
    where: dueWhere(cutoff),
    _sum: { amountBirr: true },
    _count: { _all: true },
  });
  const eligible = groups.filter(
    (group) => (group._sum.amountBirr ?? 0) >= PAYOUT_MIN_BIRR,
  );
  if (eligible.length === 0) return [];

  const creators = await prisma.user.findMany({
    where: { id: { in: eligible.map((group) => group.creatorId) } },
    select: {
      id: true,
      email: true,
      name: true,
      creatorDisplayName: true,
      creatorPhone: true,
      payoutMethod: true,
      payoutAccountName: true,
      payoutAccountNumber: true,
      payoutBankName: true,
    },
  });
  const byId = new Map(creators.map((creator) => [creator.id, creator]));

  return eligible
    .map((group): DuePayout => {
      const creator = byId.get(group.creatorId);
      return {
        creatorId: group.creatorId,
        creatorName:
          creator?.creatorDisplayName || creator?.name || creator?.email || "Unknown",
        creatorEmail: creator?.email ?? "",
        creatorPhone: creator?.creatorPhone ?? null,
        amountBirr: group._sum.amountBirr ?? 0,
        commissionCount: group._count._all,
        payoutMethod: creator?.payoutMethod ?? null,
        payoutAccountName: creator?.payoutAccountName ?? null,
        payoutAccountNumber: creator?.payoutAccountNumber ?? null,
        payoutBankName: creator?.payoutBankName ?? null,
      };
    })
    .sort((a, b) => b.amountBirr - a.amountBirr);
}

export class PayoutError extends Error {}

// Records that admin paid one creator for `cutoff`: creates the Payout
// (payout details snapshotted) and moves its commissions to PAID — all
// in one transaction. The conditional updateMany (status still PENDING)
// makes a double-submit fail instead of paying twice.
export async function markPayoutPaid(creatorId: string, cutoff: Date) {
  return prisma.$transaction(async (tx) => {
    const commissions = await tx.commission.findMany({
      where: dueWhere(cutoff, creatorId),
      select: { id: true, amountBirr: true },
    });
    const amountBirr = commissions.reduce((sum, c) => sum + c.amountBirr, 0);
    if (commissions.length === 0 || amountBirr < PAYOUT_MIN_BIRR) {
      throw new PayoutError("Nothing due for this creator");
    }

    const creator = await tx.user.findUnique({
      where: { id: creatorId },
      select: {
        payoutMethod: true,
        payoutAccountName: true,
        payoutAccountNumber: true,
        payoutBankName: true,
      },
    });

    const paidAt = new Date();
    const payout = await tx.payout.create({
      data: {
        creatorId,
        amountBirr,
        cutoffAt: cutoff,
        paidAt,
        payoutMethod: creator?.payoutMethod ?? null,
        payoutAccountName: creator?.payoutAccountName ?? null,
        payoutAccountNumber: creator?.payoutAccountNumber ?? null,
        payoutBankName: creator?.payoutBankName ?? null,
      },
    });

    const updated = await tx.commission.updateMany({
      where: { id: { in: commissions.map((c) => c.id) }, status: "PENDING" },
      data: { status: "PAID", paidAt, payoutId: payout.id },
    });
    if (updated.count !== commissions.length) {
      throw new PayoutError("This payout was already recorded");
    }

    return { ...payout, commissionCount: commissions.length };
  });
}
