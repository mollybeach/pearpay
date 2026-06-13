import {
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
  getAddress,
  http,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  ARC_TESTNET_EURC_ADDRESS,
  getArcNetworkConfig,
  type ArcNetworkConfig,
} from "./config";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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
  forwarder: "arc-onchain" | "circle-gateway" | "circle-forwarder-scaffold";
}

/** Build a viem chain object for the configured Arc network. */
function arcChain(arc: ArcNetworkConfig) {
  return defineChain({
    id: arc.chainId,
    name: arc.name,
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: { default: { http: [arc.rpcUrl] } },
    blockExplorers: { default: { name: "ArcScan", url: arc.explorerUrl } },
    testnet: true,
  });
}

/** Address of the configured funder/treasury wallet, if a key is set. */
export function arcFunderAddress(): `0x${string}` | null {
  const key = getEnv().FUNDER_PRIVATE_KEY;
  if (!key) return null;
  try {
    return privateKeyToAccount(key as `0x${string}`).address;
  } catch {
    return null;
  }
}

/** Resolve the USDC token address for a chain, defaulting to Arc. */
export function usdcAddress(chainId: number): `0x${string}` {
  return USDC_ADDRESSES[chainId] ?? ARC_USDC_ADDRESS;
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
  // Prefer the env-configured Arc USDC address for the Arc chain.
  const tokenAddress =
    destinationChainId === arc.chainId
      ? arc.stablecoins.USDC
      : usdcAddress(destinationChainId);
  const route =
    sourceChainId === destinationChainId ? "arc-native" : "source-to-arc";

  // Real on-chain settlement is possible when a funder/treasury key is set and
  // we're settling on the configured Arc chain to a real recipient address.
  const canSettleOnChain =
    Boolean(env.FUNDER_PRIVATE_KEY) &&
    destinationChainId === arc.chainId &&
    isAddress(req.toAddress, { strict: false }) &&
    req.toAddress.toLowerCase() !== ZERO_ADDRESS;

  if (canSettleOnChain) {
    try {
      const account = privateKeyToAccount(
        env.FUNDER_PRIVATE_KEY as `0x${string}`,
      );
      const chain = arcChain(arc);
      const wallet = createWalletClient({
        account,
        chain,
        transport: http(arc.rpcUrl),
      });
      const publicClient = createPublicClient({
        chain,
        transport: http(arc.rpcUrl),
      });

      // Normalize to a checksummed address (accepts any-case valid input).
      const recipient = getAddress(req.toAddress.toLowerCase() as `0x${string}`);
      const txHash = await wallet.writeContract({
        address: getAddress(tokenAddress.toLowerCase() as `0x${string}`),
        abi: erc20Abi,
        functionName: "transfer",
        args: [recipient, req.amount],
      });
      log.info("arc on-chain settlement broadcast", {
        txHash,
        amount: formatUsdc(req.amount),
        to: req.toAddress,
      });

      // Wait briefly for inclusion; report "pending" if it hasn't confirmed.
      let status: SettlementReceipt["status"] = "pending";
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: 30_000,
        });
        status = receipt.status === "success" ? "settled" : "pending";
      } catch {
        /* still pending — return the hash so the caller can poll. */
      }

      return {
        settlementId: `arc_${txHash.slice(2, 12)}`,
        txHash,
        chainId: destinationChainId,
        sourceChainId,
        destinationChainId,
        amount: req.amount,
        status,
        tokenAddress,
        route,
        forwarder: "arc-onchain",
      };
    } catch (err) {
      log.error("arc on-chain settlement failed", { err: String(err) });
      throw new Error(
        `Arc settlement failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // No funder key (or non-Arc / placeholder recipient): deterministic stub so
  // local demos and tests still work without funded keys.
  assertConfiguredForProduction("arc", false);
  const fakeHash = `0x${Buffer.from(
    `${req.fromAddress}${req.toAddress}${req.amount}`,
  )
    .toString("hex")
    .padEnd(64, "0")
    .slice(0, 64)}` as `0x${string}`;
  log.debug("arc stub settlement", {
    amount: formatUsdc(req.amount),
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

export {
  ARC_TESTNET_CHAIN_ID,
  ARC_USDC_ADDRESS,
  ARC_TESTNET_EURC_ADDRESS,
  getArcNetworkConfig,
};
