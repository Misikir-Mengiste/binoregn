import { prisma } from "@/lib/prisma";

// Rules for a creator promoting a product (progress-tracker 2026-11-11):
// - one Application row per creator+product; after a rejection the
//   creator may request again REREQUEST_AFTER_DAYS days later (the row
//   is reset to PENDING rather than a second row being created);
// - Product.maxCreators caps how many creators may promote it. Only
//   approved creators use a spot (an AffiliateLink exists exactly for
//   each approval), so pending requests never block anyone.

export const REREQUEST_AFTER_DAYS = 7;

export function requestAgainAt(decidedAt: Date) {
  return new Date(decidedAt.getTime() + REREQUEST_AFTER_DAYS * 24 * 60 * 60 * 1000);
}

export async function approvedCreatorCount(productId: string) {
  return prisma.affiliateLink.count({ where: { productId } });
}

// null = unlimited.
export function spotsLeft(maxCreators: number | null, approvedCount: number) {
  if (maxCreators === null) return null;
  return Math.max(maxCreators - approvedCount, 0);
}

export type PromoteState =
  | { kind: "REQUEST" }
  | { kind: "PENDING" }
  | { kind: "APPROVED"; linkSlug: string }
  | { kind: "REJECTED"; requestAgainAt: string | null }
  | { kind: "FULL" };

// What the creator's single promote button should show. Order matters:
// an approved creator keeps their link even when the product is full;
// "Full" only blocks creators who would otherwise be able to request.
export function promoteState(input: {
  status: "PENDING" | "APPROVED" | "REJECTED" | null;
  decidedAt: Date | null;
  linkSlug: string | null;
  spotsLeft: number | null;
  now?: Date;
}): PromoteState {
  const now = input.now ?? new Date();
  if (input.status === "APPROVED" && input.linkSlug) {
    return { kind: "APPROVED", linkSlug: input.linkSlug };
  }
  if (input.status === "PENDING") return { kind: "PENDING" };
  if (input.status === "REJECTED") {
    const againAt = input.decidedAt ? requestAgainAt(input.decidedAt) : null;
    if (againAt && againAt > now) {
      return { kind: "REJECTED", requestAgainAt: againAt.toISOString() };
    }
  }
  if (input.spotsLeft === 0) return { kind: "FULL" };
  // Never requested, or rejected and the wait is over.
  return { kind: "REQUEST" };
}
