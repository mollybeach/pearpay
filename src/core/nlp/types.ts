import type { UsdcAmount } from "@/lib/money";

/** The kind of action a user expressed in natural language. */
export type IntentType = "send" | "split" | "request" | "unknown";

/** A raw, unresolved reference to a recipient as it appeared in a message. */
export interface RawRecipient {
  /** The literal token, e.g. "Molly", "@molly", "molly.eth", "+12069476991". */
  raw: string;
  /** A best-effort guess at the reference kind, refined later by the resolver. */
  hint: RecipientHint;
}

export type RecipientHint =
  | "ens"
  | "phone"
  | "email"
  | "handle"
  | "name"
  | "agent";

/** A structured payment intent parsed from a natural-language message. */
export interface PaymentIntent {
  type: IntentType;
  /** Recipients referenced in the message (one for send, many for split). */
  recipients: RawRecipient[];
  /** Amount in USDC base units, when an explicit amount was present. */
  amount?: UsdcAmount;
  /** Free-text memo, e.g. "for dinner" or "for the Airbnb". */
  memo?: string;
  /** Whether the user asked for a private transfer. */
  private: boolean;
  /** Parser confidence in [0, 1]. */
  confidence: number;
  /** The original message text, retained for auditing and debugging. */
  original: string;
}
