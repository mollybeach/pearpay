import type { RecipientHint } from "@/core/nlp/types";

/**
 * How a resolved recipient can receive funds. Drives whether the payment
 * settles instantly or becomes a claimable escrow.
 */
export type DeliveryMode =
  | "instant" // Existing Pear Pay user or discoverable wallet.
  | "claimable"; // New user — escrow + Twilio claim link.

/** The contact channel used to notify a recipient of a claimable payment. */
export type NotificationChannel =
  | "none" // Instant delivery, no external notification needed.
  | "sms"
  | "whatsapp"
  | "email"
  | "telegram"
  | "discord";

/** A fully resolved recipient ready to receive a payment. */
export interface ResolvedRecipient {
  /** The original reference from the message ("Molly", "@molly", ...). */
  raw: string;
  hint: RecipientHint;
  /** Canonical display label, e.g. "Molly" or "+1 (206) 947-6991". */
  label: string;
  /** On-chain address when known (existing wallet). */
  address?: `0x${string}`;
  /** Whether this person already has a Pear Pay account. */
  isPearPayUser: boolean;
  deliveryMode: DeliveryMode;
  notificationChannel: NotificationChannel;
  /** Channel-specific contact value (phone number, email, handle). */
  contact?: string;
}

/** Context passed to the resolver, e.g. the channel a message arrived on. */
export interface ResolutionContext {
  /** The channel the request originated from, used to bias handle resolution. */
  channel?: "imessage" | "telegram" | "discord" | "slack" | "whatsapp" | "sms" | "voice" | "agent";
}
