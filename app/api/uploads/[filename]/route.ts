import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

// Next's static /public handler caches the directory listing at server
// startup, so a file written to public/uploads/ after boot 404s until
// the process restarts (see app/api/admin/uploads/route.ts). Serving
// through a route handler instead reads from disk on every request, so
// newly uploaded images are available immediately.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.[a-z]+$/.test(filename)) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  const extension = filename.split(".").pop() ?? "";
  const contentType = CONTENT_TYPE[extension];
  if (!contentType) {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", filename);
  try {
    const bytes = await readFile(filePath);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: { message: "Not found" } }, { status: 404 });
  }
}
