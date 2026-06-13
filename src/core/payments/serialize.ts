import { formatUsdc, formatUsdcDisplay } from "@/lib/money";
import type { PaymentLeg, PaymentResult } from "./types";

export interface SerializedPaymentLeg {
  recipient: {
    raw: string;
    label: string;
    hint: PaymentLeg["recipient"]["hint"];
    isPearPayUser: boolean;
    address?: `0x${string}`;
    contact?: string;
    deliveryMode: PaymentLeg["recipient"]["deliveryMode"];
    notificationChannel: PaymentLeg["recipient"]["notificationChannel"];
  };
  amount: {
    usdc: string;
    baseUnits: string;
    display: string;
  };
  outcome: PaymentLeg["outcome"];
  rail?: PaymentLeg["rail"];
  txHash?: PaymentLeg["txHash"];
  settlementRef?: string;
  sourceChainId?: number;
  destinationChainId?: number;
  tokenAddress?: `0x${string}`;
  route?: PaymentLeg["route"];
  claimUrl?: string;
  payUrl?: string;
  notified: boolean;
  private: boolean;
}

export interface SerializedPaymentResult {
  ok: boolean;
  summary: string;
  legs: SerializedPaymentLeg[];
  payUrl?: string;
  error?: string;
}

export function serializePaymentLeg(leg: PaymentLeg): SerializedPaymentLeg {
  return {
    recipient: {
      raw: leg.recipient.raw,
      label: leg.recipient.label,
      hint: leg.recipient.hint,
      isPearPayUser: leg.recipient.isPearPayUser,
      address: leg.recipient.address,
      contact: leg.recipient.contact,
      deliveryMode: leg.recipient.deliveryMode,
      notificationChannel: leg.recipient.notificationChannel,
    },
    amount: {
      usdc: formatUsdc(leg.amount),
      baseUnits: leg.amount.toString(),
      display: formatUsdcDisplay(leg.amount),
    },
    outcome: leg.outcome,
    rail: leg.rail,
    txHash: leg.txHash,
    settlementRef: leg.settlementRef,
    sourceChainId: leg.sourceChainId,
    destinationChainId: leg.destinationChainId,
    tokenAddress: leg.tokenAddress,
    route: leg.route,
    claimUrl: leg.claimUrl,
    payUrl: leg.payUrl,
    notified: leg.notified,
    private: leg.private,
  };
}

export function serializePaymentResult(
  result: PaymentResult,
): SerializedPaymentResult {
  return {
    ok: result.ok,
    summary: result.summary,
    legs: result.legs.map(serializePaymentLeg),
    payUrl: result.payUrl,
    error: result.error,
  };
}
