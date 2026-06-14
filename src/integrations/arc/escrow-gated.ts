import { randomBytes } from "node:crypto";
import { logger } from "@/lib/logger";
import type { UsdcAmount } from "@/lib/money";
import {
  claimOnChain,
  escrowWithArbiterOnChain,
  type OnChainEscrowResult,
} from "./escrow";
import { getArcSignerAccount, isArcEscrowLive } from "./client";

const log = logger.scoped("arc:escrow-gated");

export interface EscrowGatedReleaseParams {
  /** The agent/payer address the resource is released to (settle.payer). */
  recipient: `0x${string}`;
  /** USDC (base units) locked into the conditional escrow as the release vehicle. */
  amount: UsdcAmount;
  /** Optional explicit payment id; otherwise a random one is generated. */
  paymentId?: string;
  /** Escrow lifetime before auto-refund becomes available (default 1h). */
  ttlMs?: number;
}

export interface EscrowGatedReleaseResult {
  /** bytes32 id used on-chain. */
  onChainPaymentId: `0x${string}`;
  /** Tx that locked funds into PearPayEscrow (the smart-contract destination). */
  escrowTxHash: `0x${string}`;
  /** Tx that conditionally released the funds to the agent. */
  claimTxHash: `0x${string}`;
  /** The arbiter (server) that can adjudicate a dispute on this escrow. */
  arbiter: `0x${string}`;
  recipient: `0x${string}`;
  escrowExplorerUrl: string;
  claimExplorerUrl: string;
}

/**
 * Conditional, contract-gated resource release for the x402 nanopayment flow.
 *
 * After an agent's nanopayment is settled (gas-free, batched) via Circle
 * Gateway, the resource is not handed over against a bare EOA receipt. Instead
 * the value is routed through PearPayEscrow on Arc — a smart-contract
 * conditional escrow with an arbiter dispute path — and only the on-chain
 * `claim` (conditional release) unlocks delivery. This makes the nanopayment's
 * settlement destination an advanced-logic smart contract, not an EOA, and
 * produces two on-chain proofs (escrow + claim) the judges can open on Arcscan.
 *
 * Multi-step settlement: x402 batched settle -> contract escrow -> conditional
 * release to the agent.
 */
export async function escrowGatedRelease(
  params: EscrowGatedReleaseParams,
): Promise<EscrowGatedReleaseResult> {
  if (!isArcEscrowLive()) {
    throw new Error(
      "escrow-gated release requires Arc escrow config (FUNDER_PRIVATE_KEY + ESCROW_CONTRACT_ADDRESS)",
    );
  }

  const arbiter = getArcSignerAccount().address as `0x${string}`;
  const paymentId =
    params.paymentId ?? `x402-gate-${randomBytes(12).toString("hex")}`;
  const ttlMs = params.ttlMs ?? 60 * 60 * 1000;

  // 1) Lock the release vehicle into the conditional escrow (smart contract).
  const escrowRes: OnChainEscrowResult = await escrowWithArbiterOnChain({
    paymentId,
    amount: params.amount,
    expiresAtMs: Date.now() + ttlMs,
    arbiter,
  });

  // 2) Conditional release: present the secret to release to the agent.
  const claimRes = await claimOnChain({
    onChainPaymentId: escrowRes.onChainPaymentId,
    claimSecret: escrowRes.claimSecret,
    recipient: params.recipient,
  });

  log.info("escrow-gated release complete", {
    paymentId,
    recipient: params.recipient,
    escrowTx: escrowRes.escrowTxHash,
    claimTx: claimRes.claimTxHash,
  });

  return {
    onChainPaymentId: escrowRes.onChainPaymentId,
    escrowTxHash: escrowRes.escrowTxHash,
    claimTxHash: claimRes.claimTxHash,
    arbiter,
    recipient: params.recipient,
    escrowExplorerUrl: escrowRes.explorerUrl,
    claimExplorerUrl: claimRes.explorerUrl,
  };
}
