// Shared password hashing + verification helpers.
//
// All accounts (tutors, admins, students) are hashed with bcrypt. Older
// accounts used SHA-256 and are transparently upgraded to bcrypt the next time
// the user successfully logs in — no password reset required.
//
//   - Tutor/admin legacy hashes:  SHA-256(password + LEGACY_TUTOR_SALT)
//   - Student legacy hashes:      SHA-256(password)   (unsalted)
//
// This module exports plain helpers only (no Convex functions); it runs in the
// default Convex runtime, where both `crypto.subtle` and `bcryptjs` work.

import bcrypt from "bcryptjs";

const LEGACY_TUTOR_SALT = "simple_tuition_salt_2024";
const BCRYPT_ROUNDS = 12;

/** Legacy schemes we still accept (and upgrade away from) on login. */
export type LegacyScheme = "tutorSalted" | "studentPlain";

export function isBcryptHash(hash: string): boolean {
  return (
    hash.startsWith("$2a$") ||
    hash.startsWith("$2b$") ||
    hash.startsWith("$2y$")
  );
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify a password against a stored hash. If the stored hash is a legacy
 * SHA-256 hash and the password matches, returns a fresh bcrypt `newHash` so
 * the caller can upgrade the stored value in place.
 */
export async function verifyPasswordAndMaybeUpgrade(
  password: string,
  currentHash: string,
  legacy: LegacyScheme,
): Promise<{ valid: boolean; newHash?: string }> {
  if (isBcryptHash(currentHash)) {
    return { valid: bcrypt.compareSync(password, currentHash) };
  }

  const legacyHash =
    legacy === "tutorSalted"
      ? await sha256Hex(password + LEGACY_TUTOR_SALT)
      : await sha256Hex(password);

  if (legacyHash !== currentHash) {
    return { valid: false };
  }

  return { valid: true, newHash: hashPassword(password) };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
