import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
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

// Raw upload limit. Photos are compressed below (typically to a few
// hundred KB), so full-size phone photos are fine to accept.
const MAX_BYTES = 15 * 1024 * 1024; // 15MB
const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Fast pages on slow mobile connections (progress-tracker 2026-11-11):
// every still image is auto-rotated (phone EXIF), shrunk to fit
// 1600×1600 and re-encoded as WebP. GIFs are kept as-is so animation
// survives.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 80;

async function compress(bytes: Buffer, type: string) {
  if (type === "image/gif") return { bytes, extension: "gif" };
  const output = await sharp(bytes)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { bytes: output, extension: "webp" };
}

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
    return apiError("Image must be 15MB or smaller", 400);
  }

  let compressed;
  try {
    compressed = await compress(Buffer.from(await file.arrayBuffer()), file.type);
  } catch {
    // sharp couldn't decode it — the file isn't really the image type
    // its Content-Type claims.
    return apiError("That file couldn't be read as an image", 400);
  }
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${compressed.extension}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), compressed.bytes);

  return apiSuccess({ url: `/api/uploads/${filename}` });
}
