import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { markCommissionPaid } from "@/lib/commission";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const { id } = await params;

  try {
    const commission = await markCommissionPaid(id);
    return apiSuccess(commission);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Commission not found" ? 404 : 409;
    return apiError(message, status);
  }
}
