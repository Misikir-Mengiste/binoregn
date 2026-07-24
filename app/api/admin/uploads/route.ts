import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-helpers";

// Local image upload — no third-party service. The admin posts the image
// bytes here; we write them under public/uploads/ and store that path in
// the product's imageUrls. Served back through /api/uploads/<name> (see
// that route) rather than Next's static /public handler, which caches
// the directory listing at server startup and won't see files written
// after boot until the process restarts. Runs on Node (not edge) so the
// filesystem is available.
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  const authed = await requireAdmin();
  if (authed instanceof NextResponse) return authed;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return apiError("No image file provided", 400);
  }

  const extension = EXTENSION[file.type];
  if (!extension) {
    return apiError("Only JPG, PNG, WEBP, or GIF images are allowed", 400);
  }
  if (file.size > MAX_BYTES) {
    return apiError("Image must be 5MB or smaller", 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return apiSuccess({ url: `/api/uploads/${filename}` });
}
