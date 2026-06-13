import { defineChain } from "viem";
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_EXPLORER_URL,
  ARC_TESTNET_RPC_URL,
} from "./config";

/** Arc Testnet chain definition for viem clients. */
export const arcTestnet = defineChain({
  id: ARC_TESTNET_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [ARC_TESTNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: ARC_TESTNET_EXPLORER_URL },
  },
});

export function arcExplorerTxUrl(
  txHash: `0x${string}`,
  explorerUrl = ARC_TESTNET_EXPLORER_URL,
): string {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}
