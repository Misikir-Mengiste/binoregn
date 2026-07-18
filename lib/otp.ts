import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;

// sha256 rather than bcrypt: this is a short-lived (10 min),
// single-use, numeric code, not a long-term credential, so a fast
// hash is the right tradeoff — bcrypt's deliberate slowness buys
// nothing here.
function hashCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Reuses the Auth.js-shaped VerificationToken model (identifier,
// token, expires) but for OTP codes rather than magic-link tokens
// — see architecture.md's "Backend Folder Structure" /
// progress-tracker.md for why. Requesting a new code invalidates
// any previous one for that email, so only one code is ever live.
export async function storeOtpCode(email: string, code: string) {
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashCode(code),
      expires: new Date(Date.now() + OTP_TTL_MS),
    },
  });
}

// Single-use and single-attempt: the stored code is deleted as
// soon as it's checked, whether or not it matched, so a code can
// never be replayed and a mistyped code can't be retried — the
// caller has to request a new one. This is the substitute for
// real rate-limiting (no cache/queue infra in this MVP per
// architecture.md): each guess costs a full resend cycle.
const DEV_BYPASS_CODE = "000000";

export async function verifyOtpCode(email: string, code: string) {
  // Dev-only bypass so local testing doesn't require checking
  // Mailpit for the real code every time. Hard-gated on NODE_ENV
  // !== "production" — Next.js sets this automatically
  // ("development" for `next dev`, "production" for a real build),
  // so there's no separate flag to misconfigure or forget to unset.
  if (process.env.NODE_ENV !== "production" && code === DEV_BYPASS_CODE) {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    return true;
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  });
  if (!record) return false;

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  if (record.expires < new Date()) return false;
  return record.token === hashCode(code);
}
