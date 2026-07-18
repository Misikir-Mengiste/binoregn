import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requestOtpSchema } from "@/lib/validations/otp";
import { generateOtpCode, storeOtpCode } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";

// Step 1 of the passwordless creator sign-in flow (architecture.md:
// "email + 6-digit OTP"). Step 2 is signIn("otp", { email, code })
// via the NextAuth credentials provider in auth.ts, which calls
// verifyOtpCode against what this route stores.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { email } = parsed.data;
  const code = generateOtpCode();
  await storeOtpCode(email, code);
  await sendOtpEmail(email, code);

  // Always return the same response regardless of whether this
  // email already has an account — nothing here should let a
  // caller enumerate which emails are registered.
  return apiSuccess({ sent: true });
}
