import { randomBytes, randomUUID } from "node:crypto";

/**
 * Identifier helpers for payments and claims.
 *
 * Claim tokens appear in user-facing URLs (pearpay.app/claim/:id) so they use
 * a short, unambiguous, URL-safe alphabet rather than full UUIDs.
 */

const CLAIM_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/** Generate an internal payment id (UUID v4). */
export function newPaymentId(): string {
  return `pay_${randomUUID()}`;
}

/**
 * Generate a short, URL-safe claim token, e.g. "abc123". Length defaults to 10
 * which gives ~50 bits of entropy over the 31-char alphabet.
 */
export function newClaimToken(length = 10): string {
  const bytes = randomBytes(length);
  let token = "";
  for (let i = 0; i < length; i += 1) {
    token += CLAIM_ALPHABET[bytes[i]! % CLAIM_ALPHABET.length];
  }
  return token;
}
