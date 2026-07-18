import bcrypt from "bcryptjs";

// bcryptjs (pure JS, no native compile step) rather than a
// slow-by-design KDF like argon2 with extra native deps — 12 salt
// rounds is a standard, secure default for this scale.
const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
