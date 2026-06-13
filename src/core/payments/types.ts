import type { UsdcAmount } from "@/lib/money";
import type { ResolvedRecipient } from "@/core/recipients/types";

/** Sender context supplied by the calling channel. */
export interface Sender {
  label: string;
  address: `0x${string}`;
  /** Default source chain when routing is required. */
  chainId?: number;
}

/** The outcome of orchestrating a single recipient leg of a payment. */
export interface PaymentLeg {
  recipient: ResolvedRecipient;
  amount: UsdcAmount;
  /** "instant" when settled directly, "claimable" when escrowed. */
  outcome: "instant" | "claimable";
  /** The settlement rail used for an instant leg. */
  rail?: "hedera" | "arc" | "unlink";
  /** EVM settlement tx hash for instant legs settled on an EVM rail (Arc). */
  txHash?: `0x${string}`;
  /** Rail-native reference (Hedera tx id, Unlink note id, Arc settlement id). */
  settlementRef?: string;
  /** Claim URL for claimable legs. */
  claimUrl?: string;
  /** Whether a Twilio notification was dispatched. */
  notified: boolean;
  private: boolean;
}

/** The full result of processing a natural-language payment message. */
export interface PaymentResult {
  ok: boolean;
  /** Human-readable summary suitable for replying in any channel. */
  summary: string;
  legs: PaymentLeg[];
  /** Populated when the message could not be turned into a payment. */
  error?: string;
}
