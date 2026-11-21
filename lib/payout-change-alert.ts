import { emailCreator } from "@/lib/notifications";
import { CONTACT_EMAIL } from "@/lib/site";

type PayoutDetails = {
  payoutMethod: string | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
  payoutBankName: string | null;
};

// Security email when a creator's payout details change — Friday payouts
// go to these details, so the creator should hear about any change they
// didn't make. Only the last 4 digits are shown.
export function alertIfPayoutChanged(
  creatorId: string,
  before: PayoutDetails | null,
  after: PayoutDetails,
) {
  if (!before) return;
  const changed =
    before.payoutMethod !== after.payoutMethod ||
    before.payoutAccountName !== after.payoutAccountName ||
    before.payoutAccountNumber !== after.payoutAccountNumber ||
    before.payoutBankName !== after.payoutBankName;
  // First-time setup (nothing saved before) isn't a "change".
  if (!changed || !before.payoutAccountNumber) return;

  const method =
    after.payoutMethod === "TELEBIRR"
      ? "Telebirr"
      : after.payoutBankName || "Bank transfer";
  const last4 = (after.payoutAccountNumber ?? "").slice(-4);

  emailCreator(creatorId, {
    subject: "Your payout details were changed",
    heading: "Your payout details were changed",
    body: `Your Friday payouts will now go to ${method}${last4 ? ` ending in ${last4}` : ""}.

If you didn't make this change, contact us right away at ${CONTACT_EMAIL}.`,
    href: "/creator/settings",
    ctaLabel: "Review payout details",
  });
}
