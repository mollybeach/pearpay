import { getEnv } from "@/lib/env";
import { newClaimToken, newPaymentId } from "@/lib/ids";
import { logger } from "@/lib/logger";
import { createEmbeddedWallet } from "@/integrations/dynamic";
import { logToConsensus } from "@/integrations/hedera";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc";
import {
  cancelOnChain,
  claimOnChain,
  escrowOnChain,
  isArcEscrowLive,
  refundOnChain,
} from "@/integrations/arc/escrow";
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
 * Create and persist a claimable payment. When Arc escrow is live, USDC is
 * locked on-chain via PearPayEscrow.escrow(); otherwise funds are tracked
 * app-layer until claim settlement.
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

  const useOnChain = !payment.private && isArcEscrowLive();

  if (useOnChain) {
    const onChain = await escrowOnChain({
      paymentId: payment.id,
      amount: payment.amount,
      expiresAtMs: payment.expiresAt,
    });
    payment.onChainPaymentId = onChain.onChainPaymentId;
    payment.claimSecret = onChain.claimSecret;
    payment.escrowTxHash = onChain.escrowTxHash;
    payment.escrowExplorerUrl = onChain.explorerUrl;
    log.info("USDC escrowed on Arc", {
      id: payment.id,
      txHash: onChain.escrowTxHash,
    });
  }

  await getEscrowStore().save(payment);

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
    onChain: Boolean(payment.escrowTxHash),
  });
  return payment;
}

/**
 * Claim an escrowed payment. When on-chain escrow exists, releases via
 * PearPayEscrow.claim(); otherwise settles via the orchestrator rail.
 */
export async function claimPayment(
  claimToken: string,
  recipientIdentifier: string,
): Promise<ClaimablePayment> {
  const store = getEscrowStore();
  const payment = await store.getByToken(claimToken);
  if (!payment) throw new Error("Claim not found");

  if (payment.status === "claimed") {
    return payment;
  }
  if (payment.status !== "escrowed") {
    throw new Error(`Payment is ${payment.status} and cannot be claimed`);
  }
  if (payment.expiresAt <= Date.now()) {
    throw new Error("Claim has expired");
  }

  const wallet = await createEmbeddedWallet(recipientIdentifier);

  let claimTxHash = payment.claimTxHash;
  let claimExplorerUrl = payment.claimExplorerUrl;

  if (
    payment.escrowTxHash &&
    payment.onChainPaymentId &&
    payment.claimSecret &&
    isArcEscrowLive()
  ) {
    const onChain = await claimOnChain({
      onChainPaymentId: payment.onChainPaymentId,
      claimSecret: payment.claimSecret,
      recipient: wallet.address,
    });
    claimTxHash = onChain.claimTxHash;
    claimExplorerUrl = onChain.explorerUrl;
  } else {
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
  }

  const released: ClaimablePayment = {
    ...payment,
    status: "claimed",
    claimedAt: Date.now(),
    claimedByAddress: wallet.address,
    claimTxHash,
    claimExplorerUrl,
  };
  await store.save(released);

  log.info("claimable payment released", {
    id: payment.id,
    to: wallet.address,
    onChain: Boolean(claimTxHash),
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

  if (
    payment.onChainPaymentId &&
    payment.escrowTxHash &&
    isArcEscrowLive()
  ) {
    await cancelOnChain(payment.onChainPaymentId);
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
    if (
      payment.onChainPaymentId &&
      payment.escrowTxHash &&
      isArcEscrowLive()
    ) {
      try {
        await refundOnChain(payment.onChainPaymentId);
      } catch (err) {
        log.warn("on-chain refund failed", { id: payment.id, err: String(err) });
      }
    }
    await store.save({ ...payment, status: "refunded" });
    log.info("expired escrow refunded", { id: payment.id });
  }
  return expired.length;
}
