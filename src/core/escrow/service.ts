import { getEnv } from "@/lib/env";
import { newClaimToken, newPaymentId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { createEmbeddedWallet } from "@/integrations/dynamic";
import { logToConsensus } from "@/integrations/hedera";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc";
import { selectRail, settleOnRail } from "@/core/payments/settlement";
import { formatUsdcDisplay } from "@/lib/money";
import { getEscrowStore } from "./store";
import type { ClaimablePayment, CreateEscrowParams } from "./types";

const log = logger.scoped("escrow");

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days.

/** Build the public claim URL for a token (pearpay.app/claim/:token). */
export function claimUrl(claimToken: string): string {
  const base = getEnv().APP_URL.replace(/\/$/, "");
  return `${base}/claim/${claimToken}`;
}

/**
 * Create and persist a claimable payment. Funds are considered escrowed in USDC
 * the moment this returns, so the sender's experience succeeds immediately even
 * if the recipient never onboards.
 */
export async function createClaimablePayment(
  params: CreateEscrowParams,
): Promise<ClaimablePayment> {
  const now = Date.now();
  const env = getEnv();
  if (env.NODE_ENV === "production" && !env.ESCROW_DATABASE_URL) {
    throw new Error("ESCROW_DATABASE_URL is required for production escrow");
  }
  const payment: ClaimablePayment = {
    id: newPaymentId(),
    claimToken: newClaimToken(),
    senderLabel: params.senderLabel,
    senderAddress: params.senderAddress,
    recipientLabel: params.recipientLabel,
    recipientContact: params.recipientContact,
    notificationChannel: params.notificationChannel,
    amount: params.amount,
    chainId: params.chainId,
    memo: params.memo,
    private: params.private ?? false,
    status: "escrowed",
    createdAt: now,
    expiresAt: now + (params.ttlMs ?? DEFAULT_TTL_MS),
  };

  await getEscrowStore().save(payment);

  // Record the escrow on the Hedera Consensus Service for a tamper-proof trail.
  await logToConsensus({
    kind: "escrow",
    from: payment.senderLabel,
    to: payment.recipientLabel,
    amount: payment.private ? "private" : formatUsdcDisplay(payment.amount),
    memo: payment.memo,
  });

  log.info("claimable payment escrowed", {
    id: payment.id,
    token: payment.claimToken,
  });
  return payment;
}

/**
 * Claim an escrowed payment. Creates an embedded wallet for the recipient if
 * needed, then releases funds via Arc (or Unlink for private transfers).
 */
export async function claimPayment(
  claimToken: string,
  recipientIdentifier: string,
): Promise<ClaimablePayment> {
  const store = getEscrowStore();
  const payment = await store.getByToken(claimToken);
  if (!payment) throw new Error("Claim not found");

  if (payment.status === "claimed") {
    return payment; // Idempotent: already released.
  }
  if (payment.status !== "escrowed") {
    throw new Error(`Payment is ${payment.status} and cannot be claimed`);
  }
  if (payment.expiresAt <= Date.now()) {
    throw new Error("Claim has expired");
  }

  // Provision the recipient's wallet on the fly (no prior onboarding needed).
  const wallet = await createEmbeddedWallet(recipientIdentifier);

  // Release funds on the optimal rail (Hedera by default) and audit on HCS.
  const rail = selectRail({ amount: payment.amount, isPrivate: payment.private });
  await settleOnRail(rail, {
    fromAddress: payment.senderAddress,
    toAddress: wallet.address,
    amount: payment.amount,
    sourceChainId: payment.chainId,
    chainId: ARC_TESTNET_CHAIN_ID,
    memo: payment.memo,
    idempotencyKey: payment.id,
  });

  const released: ClaimablePayment = {
    ...payment,
    status: "claimed",
    claimedAt: Date.now(),
    claimedByAddress: wallet.address,
  };
  await store.save(released);

  log.info("claimable payment released", {
    id: payment.id,
    to: wallet.address,
  });
  return released;
}

/** Cancel an unclaimed payment, returning funds to the sender. */
export async function cancelPayment(id: string): Promise<ClaimablePayment> {
  const store = getEscrowStore();
  const payment = await store.getById(id);
  if (!payment) throw new Error("Payment not found");
  if (payment.status !== "escrowed") {
    throw new Error(`Cannot cancel a ${payment.status} payment`);
  }
  const cancelled: ClaimablePayment = { ...payment, status: "cancelled" };
  await store.save(cancelled);
  log.info("claimable payment cancelled", { id });
  return cancelled;
}

/** Auto-refund every expired escrow. Intended to run on a schedule. */
export async function refundExpired(now = Date.now()): Promise<number> {
  const store = getEscrowStore();
  const expired = await store.listExpired(now);
  for (const payment of expired) {
    await store.save({ ...payment, status: "refunded" });
    log.info("expired escrow refunded", { id: payment.id });
  }
  return expired.length;
}
