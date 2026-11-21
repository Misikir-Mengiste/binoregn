import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { siteSettingsSchema } from "@/lib/validations/site-settings";

// Admin Settings → site-wide settings (currently the order confirmation
// phone number and whether buyers see it).
export async function GET() {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;
  return apiSuccess(await getSiteSettings());
}

export async function PATCH(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = siteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  return apiSuccess(await updateSiteSettings(parsed.data));
}
