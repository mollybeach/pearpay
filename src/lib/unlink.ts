import type { PaymentPayload } from "@/lib/payload";

export interface ShieldResult {
  status: "shielded" | "stub";
  intentId: string;
}

export async function shieldPayment(
  payload: PaymentPayload,
): Promise<ShieldResult> {
  const res = await fetch("/api/privacy/shield", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      recipient: payload.recipient,
      intent_id: payload.intent_id,
    }),
  });

  await res.json();
  return { status: "stub", intentId: payload.intent_id };
}
