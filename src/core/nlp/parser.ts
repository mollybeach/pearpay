import { parseUsdc } from "@/lib/money";
import type {
  IntentType,
  PaymentIntent,
  RawRecipient,
  RecipientHint,
} from "./types";

/**
 * Deterministic natural-language payment parser.
 *
 * This is the rules-based first pass that turns messages like
 *   "Send Molly $20 privately for dinner"
 * into a structured PaymentIntent. It is intentionally dependency-free so it
 * runs identically across every channel (iMessage, Telegram, Discord, Voice).
 * A model-backed parser can layer on top using the same output shape.
 */

const SEND_VERBS = ["send", "pay", "transfer", "give", "venmo", "zelle"];
const SPLIT_VERBS = ["split", "divide", "share"];
const REQUEST_VERBS = ["request", "charge", "bill", "ask"];
const PRIVATE_MARKERS = ["privately", "private", "anonymously", "anonymous"];

const AMOUNT_RE =
  /\$?\b(\d+(?:\.\d{1,6})?)\b\s*(usdc|usd|dollars?|bucks?)?/i;
const ENS_RE = /\b([a-z0-9-]+\.eth)\b/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const EMAIL_RE = /\b([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})\b/i;
const HANDLE_RE = /@([a-z0-9_.]+)/i;
const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  twentyfive: 25,
  thirty: 30,
  forty: 40,
  fifty: 50,
  hundred: 100,
};

function classify(text: string): IntentType {
  const lower = text.toLowerCase();
  if (SPLIT_VERBS.some((v) => lower.includes(v))) return "split";
  if (REQUEST_VERBS.some((v) => new RegExp(`\\b${v}`).test(lower)))
    return "request";
  if (SEND_VERBS.some((v) => new RegExp(`\\b${v}`).test(lower))) return "send";
  return "unknown";
}

function extractAmount(text: string): bigint | undefined {
  const match = text.match(AMOUNT_RE);
  if (match) {
    try {
      return parseUsdc(match[1]!);
    } catch {
      /* fall through to word numbers */
    }
  }

  // Handle spelled-out amounts like "twenty dollars".
  const lower = text.toLowerCase();
  for (const [word, value] of Object.entries(WORD_NUMBERS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      return parseUsdc(value);
    }
  }
  return undefined;
}

function hintFor(token: string): RecipientHint {
  if (ENS_RE.test(token)) return "ens";
  if (EMAIL_RE.test(token)) return "email";
  if (PHONE_RE.test(token)) return "phone";
  if (token.startsWith("@")) return "handle";
  if (/-?agent\b/i.test(token) || /\bagent\b/i.test(token)) return "agent";
  return "name";
}

function extractRecipients(text: string): RawRecipient[] {
  const found = new Map<string, RawRecipient>();
  const add = (raw: string) => {
    const key = raw.toLowerCase();
    if (!found.has(key)) found.set(key, { raw, hint: hintFor(raw) });
  };

  for (const re of [ENS_RE, EMAIL_RE, PHONE_RE, HANDLE_RE]) {
    const m = text.match(re);
    if (m) add(m[0]);
  }

  // Capture "Send <Name> ..." / "Pay <Name> back" style proper-noun names.
  const verbs = [...SEND_VERBS, ...REQUEST_VERBS].join("|");
  const nameRe = new RegExp(`\\b(?:${verbs})\\s+([A-Z][a-z]+)`, "g");
  for (const m of text.matchAll(nameRe)) {
    add(m[1]!);
  }

  // "Split ... with the engineering team / everyone" → group recipient marker.
  if (/\bwith\s+(everyone|the\s+\w+(\s+team)?)/i.test(text)) {
    const m = text.match(/\bwith\s+(everyone|the\s+[\w\s]+?team|the\s+\w+)/i);
    if (m) add(m[1]!.trim());
  }

  return [...found.values()];
}

function extractMemo(text: string): string | undefined {
  const m = text.match(/\b(?:for|back for)\s+(.+?)[.!?]?$/i);
  if (!m) return undefined;
  const memo = m[1]!.trim();
  // Avoid mistaking "for $20" as a memo.
  if (AMOUNT_RE.test(memo) && memo.replace(AMOUNT_RE, "").trim() === "") {
    return undefined;
  }
  return memo.length > 0 ? memo : undefined;
}

/** Parse a natural-language message into a structured PaymentIntent. */
export function parseIntent(message: string): PaymentIntent {
  const original = message.trim();
  const type = classify(original);
  const amount = extractAmount(original);
  const recipients = extractRecipients(original);
  const memo = extractMemo(original);
  const isPrivate = PRIVATE_MARKERS.some((p) =>
    new RegExp(`\\b${p}\\b`, "i").test(original),
  );

  // Confidence reflects how much of the intent we could ground.
  let confidence = 0;
  if (type !== "unknown") confidence += 0.4;
  if (recipients.length > 0) confidence += 0.3;
  if (amount !== undefined || type === "split") confidence += 0.3;

  return {
    type,
    recipients,
    amount,
    memo,
    private: isPrivate,
    confidence: Math.min(1, confidence),
    original,
  };
}
