/**
 * Pure logic for the in-chat iMessage payment playground.
 *
 * Kept free of React so it can be unit-tested and reused: turns a
 * natural-language money request typed in the simulator into a structured
 * payment, and formats amounts for display.
 */

export type PaymentToken = "USD" | "USDC";

/** How a payment settles, which drives the payment-card styling. */
export type PaymentOutcome = "settled" | "private" | "claimable";

export interface PayInfo {
  /** Positive decimal amount (already comma-stripped). */
  amount: number;
  token: PaymentToken;
  /** Recipient as typed, e.g. "Molly", "alex.eth", "+1". */
  recipientName: string;
  /** Display label, e.g. "molly.eth". */
  recipientLabel: string;
  outcome: PaymentOutcome;
}

/** The person on the other end of the simulated thread. */
export const CONTACT = { name: "Molly", avatar: "🙂" } as const;

/**
 * Recipients already on Pear Pay → instant settlement. Anyone else is treated
 * as a new user and gets a claimable escrow link. Any *.eth name is assumed to
 * be an existing on-chain identity.
 */
export const KNOWN_RECIPIENTS = new Set([
  "molly",
  "molly.eth",
  "sarah",
  "sarah.eth",
  "alex.eth",
]);

export const QUICK_PHRASES = [
  "Send Molly $20",
  "Send Molly 50 USDC privately",
  "Send Alex $50",
] as const;

const STOP_WORDS = new Set(["me", "you", "the", "a", "an", "back", "him", "her", "them"]);

/** Format a parsed payment for display, e.g. "$20.00" or "50 USDC". */
export function formatAmount(pay: Pick<PayInfo, "amount" | "token">): string {
  return pay.token === "USDC"
    ? `${pay.amount} USDC`
    : `$${pay.amount.toFixed(2)}`;
}

function labelFor(name: string): string {
  const lower = name.toLowerCase();
  if (lower === "molly") return "molly.eth";
  if (lower === "sarah") return "sarah.eth";
  return name;
}

function isKnown(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".eth") || KNOWN_RECIPIENTS.has(lower);
}

/**
 * Parse a natural-language money request into a {@link PayInfo}, or `null` when
 * the text isn't a payment. Handles intent verbs, ENS/name/phone recipients,
 * USDC vs USD, privacy, and comma-grouped amounts ("$1,000").
 */
export function parsePayment(raw: string): PayInfo | null {
  const text = raw.trim();
  if (!text) return null;

  // Must look like a money request: a payment verb, or a "$<number>".
  const hasIntent =
    /\b(send|pay|venmo|transfer|paid|split|request)\b/i.test(text) ||
    /\$\s?\d/.test(text);

  // First number, allowing thousands separators and up to 2 decimals.
  const amtMatch = text.match(/(\d[\d,]*(?:\.\d{1,2})?)/);
  if (!hasIntent || !amtMatch) return null;

  const amount = parseFloat((amtMatch[1] ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const token: PaymentToken = /\busdc\b/i.test(text) ? "USDC" : "USD";
  const isPrivate = /\bpriv/i.test(text);

  // Recipient: prefer the token after "to", else after "send"/"pay".
  const toMatch = text.match(/\bto\s+([a-z0-9.@+]+)/i);
  const sendMatch = text.match(/\b(?:send|pay|request)\s+([a-z0-9.@]+)/i);
  let name = (toMatch?.[1] ?? sendMatch?.[1] ?? "").replace(/[.,]+$/, "");

  // Drop non-name captures (amounts, pronouns/stop-words) → default contact.
  if (!name || /^\$?\d/.test(name) || STOP_WORDS.has(name.toLowerCase())) {
    name = CONTACT.name;
  }

  const outcome: PaymentOutcome = isPrivate
    ? "private"
    : isKnown(name)
      ? "settled"
      : "claimable";

  return {
    amount,
    token,
    recipientName: name,
    recipientLabel: labelFor(name),
    outcome,
  };
}
