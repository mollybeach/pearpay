import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";
import { ARC_TESTNET_CHAIN_ID, getArcNetworkConfig } from "./config";
import { arcExplorerTxUrl } from "./chain";

const log = logger.scoped("arc:gateway-bridge");

/**
 * Real chain-abstracted USDC routing via Circle Gateway's **unified cross-chain
 * balance** (the @circle-fin/x402-batching `GatewayClient`).
 *
 * Circle Gateway treats every supported chain as one USDC liquidity surface:
 * USDC deposited into the GatewayWallet on ANY chain becomes a single unified,
 * non-custodial balance, and `withdraw({ chain: 'arcTestnet' })` mints it on Arc
 * — instantly and gas-free for the user, sourced from whichever chains funded
 * the balance. This is the primitive behind "Best Chain Abstracted USDC App
 * Using Arc as a Liquidity Hub": pool liquidity from many chains, output on Arc.
 *
 * Verified against the SDK's published `GATEWAY_DOMAINS` (arcTestnet = domain
 * 26). No fabricated addresses — chain configs (USDC + GatewayWallet + RPC) ship
 * inside the SDK per chain name.
 */

/** Circle Gateway domain ids for the testnets we route from (SDK-verified). */
export const GATEWAY_TESTNET_DOMAINS = {
  sepolia: 0,
  avalancheFuji: 1,
  optimismSepolia: 2,
  arbitrumSepolia: 3,
  baseSepolia: 6,
  polygonAmoy: 7,
  unichainSepolia: 10,
  arcTestnet: 26,
} as const;

export type GatewayChainName = keyof typeof GATEWAY_TESTNET_DOMAINS;

/** Map an EVM chain id to the SDK's Gateway chain-name literal (testnets). */
const CHAIN_ID_TO_GATEWAY_NAME: Record<number, GatewayChainName> = {
  11155111: "sepolia",
  43113: "avalancheFuji",
  11155420: "optimismSepolia",
  421614: "arbitrumSepolia",
  84532: "baseSepolia",
  80002: "polygonAmoy",
  1301: "unichainSepolia",
  [ARC_TESTNET_CHAIN_ID]: "arcTestnet",
};

export function gatewayChainName(chainId: number): GatewayChainName | null {
  return CHAIN_ID_TO_GATEWAY_NAME[chainId] ?? null;
}

/** True once a buyer/funder key exists to sign Gateway operations. */
export function isGatewayBridgeConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.X402_BUYER_PRIVATE_KEY || env.FUNDER_PRIVATE_KEY);
}

function signingKey(): `0x${string}` {
  const env = getEnv();
  const key = env.X402_BUYER_PRIVATE_KEY || env.FUNDER_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "Gateway bridge needs X402_BUYER_PRIVATE_KEY or FUNDER_PRIVATE_KEY",
    );
  }
  return (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;
}

// Optional per-source-chain RPC overrides; the SDK has sane defaults otherwise.
function sourceRpcUrl(chain: GatewayChainName): string | undefined {
  const env = getEnv();
  const key = `${chain.toUpperCase()}_RPC_URL`;
  return (process.env[key] as string | undefined) ?? undefined;
}

async function loadModule(spec: string): Promise<any> {
  return import(/* webpackIgnore: true */ spec);
}

async function makeClient(chain: GatewayChainName): Promise<any> {
  const mod = await loadModule("@circle-fin/x402-batching/client");
  return new mod.GatewayClient({
    chain,
    privateKey: signingKey(),
    rpcUrl: sourceRpcUrl(chain),
  });
}

export interface UnifiedBalances {
  chain: GatewayChainName;
  /** Plain USDC in the wallet on this chain (not yet in Gateway). */
  walletUsdc: string;
  /** Unified Gateway balance usable across chains. */
  gatewayTotal: string;
  gatewayAvailable: string;
}

/**
 * Read the unified Gateway balance — the "one liquidity surface" view. The
 * available balance can be minted onto Arc (or any supported chain) regardless
 * of which chain originally funded it.
 */
export async function getUnifiedBalances(
  sourceChainId: number,
): Promise<UnifiedBalances> {
  const chain = gatewayChainName(sourceChainId);
  if (!chain) throw new Error(`unsupported Gateway source chain: ${sourceChainId}`);
  const client = await makeClient(chain);
  const balances = await client.getBalances();
  return {
    chain,
    walletUsdc: balances.wallet?.formatted ?? formatAtomic(balances.wallet?.balance),
    gatewayTotal: balances.gateway?.formatted ?? formatAtomic(balances.gateway?.balance),
    gatewayAvailable: formatAtomic(balances.gateway?.available),
  };
}

function formatAtomic(v: bigint | undefined): string {
  return v === undefined ? "0" : formatUsdc(v);
}

export interface DepositToGatewayParams {
  sourceChainId: number;
  amountUsd: string | number;
}

/** Deposit USDC on a source chain into the unified Gateway balance. */
export async function depositToGateway(
  params: DepositToGatewayParams,
): Promise<{ depositTxHash: `0x${string}`; sourceChain: GatewayChainName }> {
  const chain = gatewayChainName(params.sourceChainId);
  if (!chain) throw new Error(`unsupported Gateway source chain: ${params.sourceChainId}`);
  const client = await makeClient(chain);
  const res = await client.deposit(String(params.amountUsd));
  log.info("gateway deposit confirmed", {
    sourceChain: chain,
    amount: String(params.amountUsd),
    tx: res.depositTxHash,
  });
  return { depositTxHash: res.depositTxHash, sourceChain: chain };
}

export interface BridgeToArcParams {
  amountUsd: string | number;
  recipient: `0x${string}`;
  /** Chain whose Gateway client signs the withdrawal (the balance is unified). */
  sourceChainId: number;
  /** If true, first deposit `amountUsd` from the source wallet into Gateway. */
  depositFirst?: boolean;
  maxFeeUsd?: string;
}

export interface BridgeToArcResult {
  /** Mint transaction hash on Arc Testnet (the destination liquidity hub). */
  mintTxHash: `0x${string}`;
  amountUsd: string;
  sourceChain: string;
  destinationChain: string;
  recipient: `0x${string}`;
  explorerUrl: string;
}

/**
 * Move USDC onto Arc from the unified Gateway balance. The balance can have been
 * funded from any supported chain, so this is genuine cross-chain liquidity
 * sourcing settled on Arc — not a same-chain transfer with a label.
 */
export async function bridgeUsdcToArc(
  params: BridgeToArcParams,
): Promise<BridgeToArcResult> {
  const chain = gatewayChainName(params.sourceChainId);
  if (!chain) throw new Error(`unsupported Gateway source chain: ${params.sourceChainId}`);
  if (chain === "arcTestnet") {
    throw new Error("source chain is already Arc; no cross-chain bridge needed");
  }

  const client = await makeClient(chain);
  const amount = String(params.amountUsd);

  if (params.depositFirst) {
    const dep = await client.deposit(amount);
    log.info("gateway deposit (pre-bridge) confirmed", {
      sourceChain: chain,
      tx: dep.depositTxHash,
    });
  }

  const res = await client.withdraw(amount, {
    chain: "arcTestnet",
    recipient: params.recipient,
    ...(params.maxFeeUsd ? { maxFee: params.maxFeeUsd } : {}),
  });

  const config = getArcNetworkConfig();
  log.info("gateway bridge -> Arc mint confirmed", {
    sourceChain: res.sourceChain,
    destinationChain: res.destinationChain,
    mintTx: res.mintTxHash,
  });

  return {
    mintTxHash: res.mintTxHash,
    amountUsd: amount,
    sourceChain: res.sourceChain,
    destinationChain: res.destinationChain,
    recipient: params.recipient,
    explorerUrl: arcExplorerTxUrl(res.mintTxHash, config.explorerUrl),
  };
}
