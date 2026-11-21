import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { sendAnnouncement } from "@/lib/notifications";

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Add a title").max(120),
  body: z.string().trim().min(1, "Add a message").max(2000),
});

// Admin → all approved, active creators (dashboard notifications).
export async function POST(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { announcement, recipients } = await sendAnnouncement(
    parsed.data.title,
    parsed.data.body,
  );
  return apiSuccess({ id: announcement.id, recipients }, 201);
}
