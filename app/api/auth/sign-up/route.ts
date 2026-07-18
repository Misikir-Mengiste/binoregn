import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { signUpSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/password";

// Only ever creates a brand-new account — never attaches a
// password to an existing email. That distinction matters: OTP and
// Google both prove ownership of an email before touching a User
// row (a mailed code / an OAuth redirect); a public sign-up POST
// proves nothing about who's submitting it. If this silently
// upserted onto an existing row the way OTP does, anyone could
// "sign up" with someone else's (or the seeded admin's) email and
// set a password on their account. So: email already exists -> 409,
// full stop, no upsert.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return apiError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
    select: { id: true, email: true },
  });

  return apiSuccess(user, 201);
}
