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
