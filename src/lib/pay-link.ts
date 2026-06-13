import { getEnv } from "@/lib/env";
import { encodePayload, type PaymentPayload } from "@/lib/payload";

export function buildPayUrl(params: {
  amount: number;
  recipient: string;
  intentId: string;
  recipientLabel?: string;
  recipientType?: "address" | "phone";
}): string {
  const payload: PaymentPayload = {
    amount: params.amount,
    token: "USDC",
    recipient: params.recipient,
    intent_id: params.intentId,
    recipient_label: params.recipientLabel,
    recipient_type: params.recipientType,
  };
  const data = encodePayload(payload);
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ??
    getEnv().APP_URL
  ).replace(/\/$/, "");
  return `${base}/pay/${data}`;
}
