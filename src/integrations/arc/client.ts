import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getEnv } from "@/lib/env";
import { arcTestnet } from "./chain";
import { getArcNetworkConfig } from "./config";

let publicClient: PublicClient | null = null;
let walletClient: WalletClient | null = null;

export function getArcRpcUrl(): string {
  const env = getEnv();
  return env.ARC_RPC_URL ?? env.NEXT_PUBLIC_ARC_RPC_URL ?? arcTestnet.rpcUrls.default.http[0]!;
}

export function getArcPublicClient(): PublicClient {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(getArcRpcUrl()),
    });
  }
  return publicClient;
}

/** Wallet client for backend-signed Arc txs (escrow, settlement). */
export function getArcWalletClient(): WalletClient {
  if (!walletClient) {
    const env = getEnv();
    const key = env.FUNDER_PRIVATE_KEY;
    if (!key) {
      throw new Error("FUNDER_PRIVATE_KEY is required for Arc on-chain signing");
    }
    const normalized = key.startsWith("0x") ? key : `0x${key}`;
    walletClient = createWalletClient({
      account: privateKeyToAccount(normalized as `0x${string}`),
      chain: arcTestnet,
      transport: http(getArcRpcUrl()),
    });
  }
  return walletClient;
}

export function getEscrowContractAddress(): `0x${string}` | null {
  const env = getEnv();
  const address = env.ARC_ESCROW_CONTRACT_ADDRESS ?? env.ESCROW_CONTRACT_ADDRESS;
  return address ? (address as `0x${string}`) : null;
}

/** True when backend can sign live Arc escrow txs. */
export function isArcEscrowLive(): boolean {
  const env = getEnv();
  return Boolean(env.FUNDER_PRIVATE_KEY && getEscrowContractAddress());
}

/** True when backend can settle USDC directly on Arc via viem. */
export function isArcOnChainSettlementLive(): boolean {
  const env = getEnv();
  const arc = getArcNetworkConfig(env);
  return Boolean(env.FUNDER_PRIVATE_KEY && (env.ARC_RPC_URL ?? arc.rpcUrl));
}
