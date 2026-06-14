import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { logger } from "@/lib/logger";
import { parseUsdc, type UsdcAmount } from "@/lib/money";
import {
  agentGatewayPay,
  type AgentPayResult,
} from "@/integrations/arc/x402-gateway";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc/config";
import { withdraw } from "./index";

const log = logger.scoped("unlink:burner");

/**
 * Ephemeral burner wallet — the blueprint's privacy primitive, implemented with
 * the REAL `@unlink-xyz/sdk` (which has no `BurnerWallet` class; the verified
 * primitives are deposit/transfer/withdraw/execute).
 *
 * Lifecycle (severs the link between the user and the on-chain payment):
 *   1. create()   — fresh single-use EOA, key lives only in memory.
 *   2. fund()     — Unlink `withdraw()` pushes the exact USDC from the shielded
 *                   pool to the burner address. The funder is NOT the payer.
 *   3. pay()      — the burner (its key) pays the x402 resource via Circle
 *                   Gateway, so the settlement's payer is the unlinkable burner.
 *   4. dispose()  — discard the key reference. (JS can't zero memory, but the
 *                   key is never persisted, logged, or returned to the client.)
 *
 * Privacy guarantee: the public ledger sees `pool -> burner` and
 * `burner -> seller`, never `user -> seller`. Amounts inside the pool are
 * shielded; the burner is created and destroyed per payment.
 */

export interface EphemeralBurner {
  address: `0x${string}`;
  privateKey: `0x${string}`;
  createdAt: number;
  disposed: boolean;
}

/** Mint a fresh single-use burner identity (key held only in memory). */
export function createEphemeralBurner(): EphemeralBurner {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return {
    address: account.address,
    privateKey,
    createdAt: Date.now(),
    disposed: false,
  };
}

/** Fund the burner from the Unlink shielded pool. Returns the withdraw tx id. */
export async function fundBurnerFromPool(
  burner: EphemeralBurner,
  amount: UsdcAmount,
  chainId: number = ARC_TESTNET_CHAIN_ID,
): Promise<{ txId: string }> {
  if (burner.disposed) throw new Error("burner already disposed");
  const res = await withdraw(burner.address, amount, chainId);
  log.info("burner funded from pool", {
    burner: burner.address,
    txId: res.txId,
  });
  return res;
}

/**
 * Cryptographically retire the burner. We cannot wipe V8 memory, but we drop
 * every reference and flip the flag so the key can never be reused. The key was
 * never persisted or sent to a client.
 */
export function disposeBurner(burner: EphemeralBurner): void {
  burner.disposed = true;
  // Overwrite the visible key material with a sentinel.
  burner.privateKey = `0x${"0".repeat(64)}` as `0x${string}`;
  log.info("burner disposed", { burner: burner.address });
}

export interface PrivateNanopaymentResult {
  ok: boolean;
  /** The unlinkable burner that actually paid (safe to show). */
  burner: `0x${string}`;
  /** Unlink withdraw tx that privately funded the burner. */
  fundTxId?: string;
  /** Circle Gateway settlement tx hash on Arc. */
  settlementTx?: string;
  payer?: string;
  error?: string;
}

/**
 * End-to-end private nanopayment for the joint Dynamic + Unlink + Arc track:
 * shielded pool -> ephemeral burner -> gas-free x402 settlement on Arc.
 */
export async function privateNanopayment(params: {
  url: string;
  amountUsd: string | number;
  chainId?: number;
}): Promise<PrivateNanopaymentResult> {
  const chainId = params.chainId ?? ARC_TESTNET_CHAIN_ID;
  const amount = parseUsdc(params.amountUsd);
  const burner = createEphemeralBurner();

  try {
    // 1. Fund the burner privately from the Unlink shielded pool.
    const fund = await fundBurnerFromPool(burner, amount, chainId);

    // 2. The burner autonomously pays the x402 resource (Circle Gateway).
    const pay: AgentPayResult = await agentGatewayPay(params.url, {
      depositUsd:
        typeof params.amountUsd === "number"
          ? params.amountUsd.toString()
          : params.amountUsd,
      privateKey: burner.privateKey,
    });

    return {
      ok: pay.paid,
      burner: burner.address,
      fundTxId: fund.txId,
      settlementTx: pay.payTx,
      payer: pay.payer,
      error: pay.error,
    };
  } catch (err) {
    return {
      ok: false,
      burner: burner.address,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    // 3. Always retire the burner, success or failure.
    disposeBurner(burner);
  }
}
