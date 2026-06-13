import { formatUsdcDisplay } from "@/lib/money";
import type { PaymentLeg, PaymentResult } from "./types";

/**
 * JSON-safe view of a payment result.
 *
 * PaymentResult holds USDC amounts as bigint base units, which cannot be
 * JSON-serialized. This DTO converts every leg into plain strings so API
 * responses (and the payment-card UI) can render them directly.
 */
export interface PaymentLegDTO {
  recipientLabel: string;
  recipientHint: string;
  isPearPayUser: boolean;
  /** Display amount, e.g. "$20". */
  amount: string;
  /** Raw USDC base units as a string, e.g. "20000000". */
  amountBaseUnits: string;
  outcome: "instant" | "claimable";
  rail?: "hedera" | "arc" | "unlink";
  txHash?: string;
  settlementRef?: string;
  claimUrl?: string;
  notificationChannel: string;
  notified: boolean;
  private: boolean;
}

export interface PaymentResultDTO {
  ok: boolean;
  summary: string;
  error?: string;
  legs: PaymentLegDTO[];
}

function serializeLeg(leg: PaymentLeg): PaymentLegDTO {
  return {
    recipientLabel: leg.recipient.label,
    recipientHint: leg.recipient.hint,
    isPearPayUser: leg.recipient.isPearPayUser,
    amount: formatUsdcDisplay(leg.amount),
    amountBaseUnits: leg.amount.toString(),
    outcome: leg.outcome,
    rail: leg.rail,
    txHash: leg.txHash,
    settlementRef: leg.settlementRef,
    claimUrl: leg.claimUrl,
    notificationChannel: leg.recipient.notificationChannel,
    notified: leg.notified,
    private: leg.private,
  };
}

/** Convert a PaymentResult into a JSON-safe DTO for API responses and the UI. */
export function serializePaymentResult(result: PaymentResult): PaymentResultDTO {
  return {
    ok: result.ok,
    summary: result.summary,
    error: result.error,
    legs: result.legs.map(serializeLeg),
  };
}
