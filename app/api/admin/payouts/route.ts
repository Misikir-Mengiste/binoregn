import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { markPayoutsPaidSchema } from "@/lib/validations/friday-payout";
import {
  getDuePayouts,
  markPayoutPaid,
  payoutCutoff,
  PayoutError,
} from "@/lib/commission/payouts";
import { birrText, notifyCreator } from "@/lib/notifications";

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "bank",
  TELEBIRR: "Telebirr",
  CBE_BIRR: "CBE Birr",
};

// Live list of creators due in the current Friday payout.
export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const cutoff = payoutCutoff();
  const due = await getDuePayouts(cutoff);
  return apiSuccess({ cutoff: cutoff.toISOString(), due });
}

// Admin paid these creators offline — record it. Each creator is its
// own transaction, so one failure (e.g. already paid) doesn't block the
// rest; the response says what happened to each.
export async function POST(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = markPayoutsPaidSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const cutoff = new Date(parsed.data.cutoff);
  // Never pay ahead: commissions after the latest Thursday cutoff
  // belong to a future Friday.
  if (cutoff.getTime() > payoutCutoff().getTime()) {
    return apiError("That payout's cutoff hasn't passed yet", 400);
  }

  const results = [];
  for (const creatorId of new Set(parsed.data.creatorIds)) {
    try {
      const payout = await markPayoutPaid(creatorId, cutoff);
      results.push({ creatorId, ok: true, payoutId: payout.id, amountBirr: payout.amountBirr });
      await notifyCreator(creatorId, {
        type: "COMMISSION_PAID",
        title: `Payout sent: ${birrText(payout.amountBirr)}`,
        body: `Paid for ${payout.commissionCount} delivered order${payout.commissionCount === 1 ? "" : "s"}${payout.payoutMethod ? ` to your ${METHOD_LABELS[payout.payoutMethod] ?? payout.payoutMethod} account` : ""}.`,
        href: "/creator/earnings",
      });
    } catch (error) {
      if (error instanceof PayoutError) {
        results.push({ creatorId, ok: false, error: error.message });
        continue;
      }
      throw error;
    }
  }

  return apiSuccess({ results });
}
