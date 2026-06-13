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
  rail?: "arc" | "unlink";
  /** EVM settlement tx hash for instant legs settled on an EVM rail (Arc). */
  txHash?: `0x${string}`;
  /** Rail-native reference (Unlink note id, Arc settlement id). */
  settlementRef?: string;
  /** Source chain detected by Pear Pay for chain-abstracted routing. */
  sourceChainId?: number;
  /** Destination settlement chain; Arc is the USDC liquidity hub. */
  destinationChainId?: number;
  /** Stablecoin contract used on the destination settlement chain. */
  tokenAddress?: `0x${string}`;
  /** Arc routing mode for Circle-native settlement. */
  route?: "arc-native" | "source-to-arc";
  /** Claim URL for claimable legs. */
  claimUrl?: string;
  /** Interactive Flow pay link for instant legs (FaceID + OG unfurl). */
  payUrl?: string;
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
  /** Shareable pay link for Flow + FaceID demo (first instant leg). */
  payUrl?: string;
  /** Populated when the message could not be turned into a payment. */
  error?: string;
}
