import type { UsdcAmount } from "@/lib/money";
import type { NotificationChannel } from "@/core/recipients/types";

export type ClaimStatus =
  | "escrowed" // Funds locked, awaiting claim.
  | "claimed" // Recipient claimed and funds released.
  | "refunded" // Expired or cancelled, returned to sender.
  | "cancelled"; // Sender cancelled before claim.

/** A claimable payment held in programmable escrow until the recipient claims. */
export interface ClaimablePayment {
  id: string;
  /** Short URL-safe token used in pearpay.app/claim/:token. */
  claimToken: string;
  senderLabel: string;
  senderAddress: `0x${string}`;
  recipientLabel: string;
  recipientContact?: string;
  notificationChannel: NotificationChannel;
  amount: UsdcAmount;
  chainId: number;
  memo?: string;
  private: boolean;
  status: ClaimStatus;
  createdAt: number;
  /** Epoch ms after which the escrow auto-refunds to the sender. */
  expiresAt: number;
  claimedAt?: number;
  claimedByAddress?: `0x${string}`;
  /** bytes32 payment key on PearPayEscrow (keccak256 of backend id). */
  onChainPaymentId?: `0x${string}`;
  /** Server-held secret for on-chain claim(); never expose via public API. */
  claimSecret?: `0x${string}`;
  /** Arc explorer link for the escrow() transaction. */
  escrowTxHash?: `0x${string}`;
  escrowExplorerUrl?: string;
  /** Arc explorer link for the claim() transaction. */
  claimTxHash?: `0x${string}`;
  claimExplorerUrl?: string;
}

/** Parameters for creating a new escrowed claimable payment. */
export interface CreateEscrowParams {
  senderLabel: string;
  senderAddress: `0x${string}`;
  recipientLabel: string;
  recipientContact?: string;
  notificationChannel: NotificationChannel;
  amount: UsdcAmount;
  chainId: number;
  memo?: string;
  private?: boolean;
  /** Time-to-live in milliseconds before auto-refund (default 7 days). */
  ttlMs?: number;
}
