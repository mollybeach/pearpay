import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_EURC_ADDRESS,
  ARC_TESTNET_EXPLORER_URL,
  ARC_TESTNET_RPC_URL,
  ARC_USDC_ADDRESS as DEFAULT_ARC_USDC_ADDRESS,
} from "@/integrations/arc/config";

export const APP_NAME = "PearPay";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "https://pearpay.app";

export const ARC_EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ??
  ARC_TESTNET_EXPLORER_URL;

export const DYNAMIC_ENVIRONMENT_ID =
  process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "";

export const ARC_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? String(ARC_TESTNET_CHAIN_ID),
);

export const ARC_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL ?? ARC_TESTNET_RPC_URL;

export const ARC_USDC_ADDRESS =
  process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ?? DEFAULT_ARC_USDC_ADDRESS;

export const ARC_EURC_ADDRESS =
  process.env.NEXT_PUBLIC_ARC_EURC_ADDRESS ?? ARC_TESTNET_EURC_ADDRESS;

/** Common Flow source tokens for cross-chain demo. */
export const FLOW_SOURCE_TOKENS = {
  native: {
    label: "Native (ETH)",
    address: "0x0000000000000000000000000000000000000000" as const,
  },
  baseUsdc: {
    label: "USDC on Base",
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913" as const,
  },
  ethUsdc: {
    label: "USDC on Ethereum",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" as const,
  },
} as const;
