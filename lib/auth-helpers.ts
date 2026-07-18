import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiError } from "@/lib/api-response";
import { Role } from "@/generated/prisma/client";

export type SessionUser = { id: string; role: Role };

async function requireRole(role: Role): Promise<SessionUser | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return apiError("Unauthenticated", 401);
  }
  if (session.user.role !== role) {
    return apiError("Forbidden", 403);
  }
  return { id: session.user.id, role: session.user.role };
}

// Every creator/admin route handler starts with one of these and
// checks `if (authed instanceof NextResponse) return authed;` —
// this is what makes "auth check exists on every mutation"
// (code-standards.md) mechanical rather than a convention someone
// has to remember per route.
export function requireCreator() {
  return requireRole(Role.CREATOR);
}

export function requireAdmin() {
  return requireRole(Role.ADMIN);
}
