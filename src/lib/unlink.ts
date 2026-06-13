import type { PaymentPayload } from "@/lib/payload";

/**
 * Client-side helper that asks the backend to shield a payment through Unlink.
 * Returns the real status + note id reported by `/api/privacy/shield`.
 */
export interface ShieldResult {
  status: "shielded" | "settled" | "stub";
  noteId?: string;
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

  const data = (await res.json().catch(() => null)) as {
    status?: string;
    note_id?: string;
  } | null;

  const status: ShieldResult["status"] =
    data?.status === "settled"
      ? "settled"
      : data?.status === "shielded"
        ? "shielded"
        : "stub";

  return { status, noteId: data?.note_id, intentId: payload.intent_id };
}
