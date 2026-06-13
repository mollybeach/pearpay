import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";

const log = logger.scoped("arc");

/**
 * Arc integration — Circle's purpose-built L1 used as Pear Pay's settlement and
 * liquidity hub. Every transfer ultimately settles in USDC; Arc treats many
 * chains as one liquidity surface (Best Chain Abstracted USDC App).
 */

/** Canonical USDC token addresses per supported chain. */
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Ethereum
  8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // Base
  42161: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", // Arbitrum
  10: "0x0b2c639c533813f4aa9d7837caf62653d097ff85", // Optimism
  137: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // Polygon
};

export interface SettlementRequest {
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  amount: UsdcAmount;
  chainId: number;
  /** Optional idempotency key so retries never double-settle. */
  idempotencyKey?: string;
}

export interface SettlementReceipt {
  settlementId: string;
  txHash: `0x${string}`;
  chainId: number;
  amount: UsdcAmount;
  status: "settled" | "pending";
}

/** Resolve the USDC token address for a chain, defaulting to Ethereum. */
export function usdcAddress(chainId: number): `0x${string}` {
  return USDC_ADDRESSES[chainId] ?? USDC_ADDRESSES[1]!;
}

/**
 * Settle a USDC transfer through Arc. When Circle credentials are absent a
 * deterministic local receipt is returned so the full flow stays demoable.
 */
export async function settleUsdc(
  req: SettlementRequest,
): Promise<SettlementReceipt> {
  const env = getEnv();

  if (!env.CIRCLE_API_KEY) {
    const fakeHash = `0x${Buffer.from(
      `${req.fromAddress}${req.toAddress}${req.amount}`,
    )
      .toString("hex")
      .padEnd(64, "0")
      .slice(0, 64)}` as `0x${string}`;
    log.debug("arc local settlement", {
      amount: formatUsdc(req.amount),
      chainId: req.chainId,
    });
    return {
      settlementId: `local_${req.idempotencyKey ?? fakeHash.slice(2, 10)}`,
      txHash: fakeHash,
      chainId: req.chainId,
      amount: req.amount,
      status: "settled",
    };
  }

  const res = await fetch(`${env.ARC_RPC_URL ?? "https://api.circle.com"}/v1/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.CIRCLE_API_KEY}`,
      ...(req.idempotencyKey
        ? { "X-Idempotency-Key": req.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      source: { address: req.fromAddress },
      destination: { address: req.toAddress },
      amount: { currency: "USDC", amount: formatUsdc(req.amount) },
      chainId: req.chainId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Arc settlement failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    id: string;
    txHash: `0x${string}`;
    status: string;
  };

  log.info("arc settlement submitted", { id: data.id, status: data.status });
  return {
    settlementId: data.id,
    txHash: data.txHash,
    chainId: req.chainId,
    amount: req.amount,
    status: data.status === "complete" ? "settled" : "pending",
  };
}
