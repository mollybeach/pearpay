/**
 * USDC money helpers.
 *
 * Pear Pay settles everything in USDC (6 decimals). All internal amounts are
 * represented as bigint base units to avoid floating-point drift; humans only
 * ever see formatted dollar strings.
 */

export const USDC_DECIMALS = 6;
const USDC_SCALAR = 10n ** BigInt(USDC_DECIMALS);

/** A USDC amount in base units (1 USDC = 1_000_000 units). */
export type UsdcAmount = bigint;

/**
 * Parse a human dollar string or number ("$20", "20.50", 20) into USDC base
 * units. Throws on malformed or negative input.
 */
export function parseUsdc(input: string | number): UsdcAmount {
  const raw =
    typeof input === "number" ? input.toString() : input.trim().replace(/^\$/, "");

  if (!/^\d+(\.\d{1,6})?$/.test(raw)) {
    throw new Error(`Invalid USDC amount: "${input}"`);
  }

  const [whole, fraction = ""] = raw.split(".");
  const paddedFraction = fraction.padEnd(USDC_DECIMALS, "0");
  const units = BigInt(whole) * USDC_SCALAR + BigInt(paddedFraction || "0");

  if (units <= 0n) {
    throw new Error(`USDC amount must be positive: "${input}"`);
  }
  return units;
}

/** Format USDC base units as a plain decimal string ("20.50"). */
export function formatUsdc(amount: UsdcAmount): string {
  const whole = amount / USDC_SCALAR;
  const fraction = amount % USDC_SCALAR;
  if (fraction === 0n) return whole.toString();

  const fractionStr = fraction
    .toString()
    .padStart(USDC_DECIMALS, "0")
    .replace(/0+$/, "");
  return `${whole}.${fractionStr}`;
}

/** Format USDC base units as a display string with a dollar sign ("$20.50"). */
export function formatUsdcDisplay(amount: UsdcAmount): string {
  return `$${formatUsdc(amount)}`;
}

/** Split an amount evenly across N recipients, distributing any remainder. */
export function splitEvenly(amount: UsdcAmount, parts: number): UsdcAmount[] {
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new Error(`Split parts must be a positive integer, got ${parts}`);
  }
  const base = amount / BigInt(parts);
  let remainder = amount % BigInt(parts);

  return Array.from({ length: parts }, () => {
    if (remainder > 0n) {
      remainder -= 1n;
      return base + 1n;
    }
    return base;
  });
}
