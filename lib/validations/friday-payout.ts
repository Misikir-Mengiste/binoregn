import { z } from "zod";

// POST /api/admin/payouts — mark one or more creators paid for the
// Friday payout covering `cutoff` (an ISO timestamp the admin page got
// from the server, lib/commission/payouts.ts payoutCutoff).
export const markPayoutsPaidSchema = z.object({
  cutoff: z.iso.datetime(),
  creatorIds: z.array(z.string().trim().min(1)).min(1).max(1000),
});
