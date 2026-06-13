export interface PaymentPayload {
  amount: number;
  token: string;
  recipient: string;
  intent_id: string;
  recipient_label?: string | null;
  recipient_type?: "address" | "phone";
}

export function decodePayload(data: string): PaymentPayload {
  const padding = "=".repeat((4 - (data.length % 4)) % 4);
  const json = Buffer.from(data + padding, "base64url").toString("utf-8");
  const parsed = JSON.parse(json) as PaymentPayload;

  if (!parsed.amount || !parsed.recipient || !parsed.intent_id) {
    throw new Error("Invalid payment payload");
  }

  return parsed;
}

export function encodePayload(payload: PaymentPayload): string {
  const raw = JSON.stringify(payload);
  return Buffer.from(raw, "utf-8")
    .toString("base64url")
    .replace(/=+$/, "");
}

export function truncateAddress(address: string): string {
  if (address.startsWith("+") || address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatRecipient(payload: PaymentPayload): string {
  if (payload.recipient_label) return payload.recipient_label;
  return truncateAddress(payload.recipient);
}
