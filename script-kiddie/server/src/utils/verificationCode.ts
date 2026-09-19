import crypto from "crypto";

export function generateVerificationCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashVerificationCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;

export function hashesMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
