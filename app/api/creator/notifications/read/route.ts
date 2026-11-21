import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-response";
import { requireCreator } from "@/lib/auth-helpers";

// Marks all of the signed-in creator's notifications read (called when
// they open the bell). Only ever touches their own rows.
export async function POST() {
  const authed = await requireCreator();
  if (authed instanceof NextResponse) return authed;

  const result = await prisma.notification.updateMany({
    where: { creatorId: authed.id, readAt: null },
    data: { readAt: new Date() },
  });

  return apiSuccess({ marked: result.count });
}
