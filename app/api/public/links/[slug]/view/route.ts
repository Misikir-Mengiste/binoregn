import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Counts one view of an affiliate link — at most once per visitor per
// 24 hours. Called by the /r/[slug] page from the browser (so link
// previews and crawlers, which don't run JS, never count). The visitor is
// identified by a random id in the "bv" cookie; nothing about the buyer
// is stored. A view counter only: it never affects commissions, and it
// never fails the page — errors just mean "not counted".
const VISITOR_COOKIE = "bv";
const COUNT_WINDOW_MS = 24 * 60 * 60 * 1000;
const VISITOR_ID = /^[0-9a-f-]{36}$/;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const existingId = request.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId =
    existingId && VISITOR_ID.test(existingId) ? existingId : randomUUID();

  let counted = false;
  try {
    counted = await countView(slug, visitorId);
  } catch (error) {
    console.error("[link-view] count failed:", error);
  }

  const response = NextResponse.json({ counted });
  if (visitorId !== existingId) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

async function countView(slug: string, visitorId: string) {
  const link = await prisma.affiliateLink.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!link) return false;

  // Both times come from here, not SQL NOW(): the column has no time
  // zone and Prisma stores UTC, while NOW() would follow the database
  // session's zone (e.g. Addis +3) and skew the 24h window.
  const now = new Date();
  const cutoff = new Date(now.getTime() - COUNT_WINDOW_MS);

  return prisma.$transaction(async (tx) => {
    // Atomic "first view, or last counted view is 24h+ old": the insert
    // or the guarded update returns a row only when this view counts, so
    // two requests at the same moment can't both count.
    const rows = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO "LinkVisit" ("id", "linkId", "visitorId", "lastCountedAt")
      VALUES (${randomUUID()}, ${link.id}, ${visitorId}, ${now})
      ON CONFLICT ("linkId", "visitorId") DO UPDATE
        SET "lastCountedAt" = ${now}
        WHERE "LinkVisit"."lastCountedAt" < ${cutoff}
      RETURNING "id"`;
    if (rows.length === 0) return false;

    await tx.affiliateLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } },
    });
    return true;
  });
}
