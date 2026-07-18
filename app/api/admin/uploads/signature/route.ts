import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";
import { createUploadSignature } from "@/lib/cloudinary";

// Returns a short-lived signature the client uses to upload an
// image directly to Cloudinary's API, then submits the resulting
// secure_url as part of imageUrls on POST/PATCH
// /api/admin/products. Nothing here touches the image bytes.
export async function POST() {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  return apiSuccess(createUploadSignature());
}
