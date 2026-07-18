import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminDashboardSummary } from "@/lib/dashboard";

// Backs the summary/promo cards in design-system.md (pending
// commission total, paid-this-month total, new application count)
// — explicitly listed under Admin Features in project-overview.md,
// not just a nice-to-have.
export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  return apiSuccess(await getAdminDashboardSummary());
}
