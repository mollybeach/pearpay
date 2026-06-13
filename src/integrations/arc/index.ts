import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";
import { transferUsdcOnArc } from "./escrow";
import { isArcOnChainSettlementLive } from "./client";
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  ARC_TESTNET_EURC_ADDRESS,
  getArcNetworkConfig,
} from "./config";
import { arcExplorerTxUrl } from "./chain";

const log = logger.scoped("arc");

/**
 * Arc integration — Circle's purpose-built L1 used as Pear Pay's settlement and
 * liquidity hub. Every transfer ultimately settles in USDC; Arc treats many
 * chains as one liquidity surface (Best Chain Abstracted USDC App).
 */

/** Canonical USDC token addresses per supported chain. */
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  [ARC_TESTNET_CHAIN_ID]: ARC_USDC_ADDRESS, // Arc Testnet
  1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // Ethereum
  8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", // Base
  42161: "0xaf88d065e77c8cc2239327c5edb3a432268e5831", // Arbitrum
  10: "0x0b2c639c533813f4aa9d7837caf62653d097ff85", // Optimism
  137: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", // Polygon
};

export const EURC_ADDRESSES: Record<number, `0x${string}`> = {
  [ARC_TESTNET_CHAIN_ID]: ARC_TESTNET_EURC_ADDRESS,
};

export interface SettlementRequest {
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  amount: UsdcAmount;
  /** Chain where funds originate; users never choose this manually. */
  sourceChainId?: number;
  /** Arc settlement chain. Defaults to the configured Arc testnet. */
  chainId?: number;
  /** Optional idempotency key so retries never double-settle. */
  idempotencyKey?: string;
}

export interface SettlementReceipt {
  settlementId: string;
  txHash: `0x${string}`;
  chainId: number;
  sourceChainId: number;
  destinationChainId: number;
  amount: UsdcAmount;
  status: "settled" | "pending";
  tokenAddress: `0x${string}`;
  route: "arc-native" | "source-to-arc";
  forwarder: "circle-gateway" | "circle-forwarder-scaffold" | "arc-native-viem";
}

/** Resolve the USDC token address for a chain, defaulting to Arc. */
export function usdcAddress(chainId: number): `0x${string}` {
  return USDC_ADDRESSES[chainId] ?? ARC_USDC_ADDRESS;
}

function localStubSettlement(
  req: SettlementRequest,
  destinationChainId: number,
  sourceChainId: number,
  tokenAddress: `0x${string}`,
  route: "arc-native" | "source-to-arc",
): SettlementReceipt {
  assertConfiguredForProduction("arc", false);
  const fakeHash = `0x${Buffer.from(
    `${req.fromAddress}${req.toAddress}${req.amount}`,
  )
    .toString("hex")
    .padEnd(64, "0")
    .slice(0, 64)}` as `0x${string}`;
  log.debug("arc local settlement", {
    amount: formatUsdc(req.amount),
    sourceChainId,
    destinationChainId,
    route,
  });
  return {
    settlementId: `local_${req.idempotencyKey ?? fakeHash.slice(2, 10)}`,
    txHash: fakeHash,
    chainId: destinationChainId,
    sourceChainId,
    destinationChainId,
    amount: req.amount,
    status: "settled",
    tokenAddress,
    route,
    forwarder: "circle-forwarder-scaffold",
  };
}

/**
 * Settle a USDC transfer through Arc. Local and test environments can return a
 * deterministic receipt, but production requires Circle credentials.
 */
export async function settleUsdc(
  req: SettlementRequest,
): Promise<SettlementReceipt> {
  const env = getEnv();
  const arc = getArcNetworkConfig(env);
  const destinationChainId = req.chainId ?? arc.chainId;
  const sourceChainId = req.sourceChainId ?? destinationChainId;
  const tokenAddress = usdcAddress(destinationChainId);
  const route = sourceChainId === destinationChainId ? "arc-native" : "source-to-arc";

  if (
    isArcOnChainSettlementLive() &&
    sourceChainId === destinationChainId &&
    destinationChainId === arc.chainId
  ) {
    const { txHash } = await transferUsdcOnArc(req.toAddress, req.amount);
    log.info("arc on-chain settlement confirmed", {
      txHash,
      amount: formatUsdc(req.amount),
    });
    return {
      settlementId: `arc_${req.idempotencyKey ?? txHash.slice(2, 10)}`,
      txHash,
      chainId: destinationChainId,
      sourceChainId,
      destinationChainId,
      amount: req.amount,
      status: "settled",
      tokenAddress,
      route: "arc-native",
      forwarder: "arc-native-viem",
    };
  }

  if (
    !env.CIRCLE_API_KEY ||
    env.NODE_ENV === "test" ||
    (env.NODE_ENV !== "production" && !isArcOnChainSettlementLive())
  ) {
    return localStubSettlement(
      req,
      destinationChainId,
      sourceChainId,
      tokenAddress,
      route,
    );
  }

  // Circle Wallets / Gateway API — not the blockchain RPC URL.
  const circleApiBase = env.ARC_RPC_URL?.includes("rpc.")
    ? "https://api.circle.com"
    : (env.ARC_RPC_URL ?? "https://api.circle.com");

  const res = await fetch(`${circleApiBase}/v1/transfers`, {
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
      sourceChainId,
      destinationChainId,
      tokenAddress,
      route,
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
    chainId: destinationChainId,
    sourceChainId,
    destinationChainId,
    amount: req.amount,
    status: data.status === "complete" ? "settled" : "pending",
    tokenAddress,
    route,
    forwarder: "circle-gateway",
  };
}

export {
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  ARC_TESTNET_EURC_ADDRESS,
  getArcNetworkConfig,
  arcExplorerTxUrl,
};
export { isArcEscrowLive, isArcOnChainSettlementLive } from "./client";
export {
  escrowOnChain,
  claimOnChain,
  paymentIdToBytes32,
  generateClaimCredentials,
} from "./escrow";
