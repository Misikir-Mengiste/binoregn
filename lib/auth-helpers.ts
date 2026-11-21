import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
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

// For admin PAGES (server components). Must be the first thing every
// app/admin page does: Next.js renders a page in parallel with its layout,
// so a role check that lives only in app/admin/layout.tsx still lets the
// page run its queries and ship that data (buyer names, phones…) in the
// response to a signed-in creator. Redirects before anything is read.
export async function requireAdminPage(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  if (session.user.role !== Role.ADMIN) redirect("/dashboard");
  return { id: session.user.id, role: session.user.role };
}
