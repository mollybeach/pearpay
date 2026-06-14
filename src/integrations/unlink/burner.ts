import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { logger } from "@/lib/logger";
import { parseUsdc, formatUsdc, type UsdcAmount } from "@/lib/money";
import {
  agentGatewayPay,
  type AgentPayResult,
} from "@/integrations/arc/x402-gateway";
import { ARC_TESTNET_CHAIN_ID, ARC_USDC_ADDRESS } from "@/integrations/arc/config";
import { getArcPublicClient, getArcWalletClient, getArcSignerAccount } from "@/integrations/arc/client";
import { ERC20_ABI } from "@/integrations/arc/abi";
import { withdraw } from "./index";

const log = logger.scoped("unlink:burner");

const BALANCE_POLL_MS = 2_000;
const BALANCE_TIMEOUT_MS = 90_000;
/** Extra shielded USDC so the burner can pay Gateway deposit gas on Arc. */
const GATEWAY_DEPOSIT_BUFFER = parseUsdc("0.015");
/** Keep this much ERC-20 on the EOA after Gateway deposit (EIP-3009 auth headroom). */
const EOA_PAYMENT_HEADROOM = parseUsdc("0.005");

/** Wait until USDC has landed on the burner's EOA (RPC can lag the sequencer). */
async function waitForBurnerBalance(
  burner: EphemeralBurner,
  amount: UsdcAmount,
): Promise<void> {
  const client = getArcPublicClient();
  const deadline = Date.now() + BALANCE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const balance = await client.readContract({
      address: ARC_USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [burner.address],
    });
    if (balance >= amount) {
      log.info("burner on-chain balance confirmed", {
        burner: burner.address,
        balance: balance.toString(),
      });
      return;
    }
    await new Promise((r) => setTimeout(r, BALANCE_POLL_MS));
  }
  throw new Error(
    `burner USDC not confirmed on-chain within ${BALANCE_TIMEOUT_MS}ms`,
  );
}

/** Arc gas is native USDC (18 dec); top up from funder if Unlink withdraw omitted it. */
async function ensureBurnerNativeGas(burner: EphemeralBurner): Promise<void> {
  const client = getArcPublicClient();
  const minNative = 500_000_000_000_000n; // ~0.0005 native USDC
  let native = await client.getBalance({ address: burner.address });
  if (native >= minNative) {
    log.info("burner native gas ok", {
      burner: burner.address,
      native: native.toString(),
    });
    return;
  }

  const funder = getArcWalletClient();
  const account = getArcSignerAccount();
  const topUp = 2_000_000_000_000_000n; // 0.002 native USDC for approve+deposit
  const hash = await funder.sendTransaction({
    account,
    chain: null,
    to: burner.address,
    value: topUp,
  });
  await client.waitForTransactionReceipt({ hash });
  native = await client.getBalance({ address: burner.address });
  log.info("burner native gas topped up", {
    burner: burner.address,
    native: native.toString(),
  });
}

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
  const fundAmount = amount + GATEWAY_DEPOSIT_BUFFER + EOA_PAYMENT_HEADROOM;
  const burner = createEphemeralBurner();

  try {
    const fund = await fundBurnerFromPool(burner, fundAmount, chainId);
    await waitForBurnerBalance(burner, fundAmount);
    await ensureBurnerNativeGas(burner);
    const pay: AgentPayResult = await agentGatewayPay(params.url, {
      privateKey: burner.privateKey,
      depositUsd: formatUsdc(GATEWAY_DEPOSIT_BUFFER),
    });
    log.info("burner x402 result", {
      burner: burner.address,
      ok: pay.paid,
      error: pay.error,
      payTx: pay.payTx,
    });

    return {
      ok: pay.paid,
      burner: burner.address,
      fundTxId: fund.txId,
      settlementTx:
        pay.payTx ||
        (pay.data as { settlement_tx?: string } | undefined)?.settlement_tx,
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
