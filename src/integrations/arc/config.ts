export const ARC_TESTNET_CHAIN_ID = 5042002;

export const ARC_USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;
export const ARC_TESTNET_EURC_ADDRESS =
  "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as const;

export const ARC_TESTNET_RPC_URL = "https://rpc.testnet.arc.network";
export const ARC_TESTNET_EXPLORER_URL = "https://testnet.arcscan.app";

export const HEDERA_USDC_TOKEN_IDS = {
  mainnet: "0.0.456858",
  testnet: "0.0.429274",
} as const;

export type ArcStablecoinSymbol = "USDC" | "EURC";

export interface ArcNetworkConfig {
  name: "Arc Testnet";
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  stablecoins: Record<ArcStablecoinSymbol, `0x${string}`>;
}

export function getArcNetworkConfig(
  env: {
    NEXT_PUBLIC_ARC_CHAIN_ID?: number;
    NEXT_PUBLIC_ARC_RPC_URL?: string;
    NEXT_PUBLIC_ARC_EXPLORER_URL?: string;
    NEXT_PUBLIC_ARC_USDC_ADDRESS?: string;
    ARC_USDC_ADDRESS?: string;
  } = {},
): ArcNetworkConfig {
  return {
    name: "Arc Testnet",
    chainId: env.NEXT_PUBLIC_ARC_CHAIN_ID ?? ARC_TESTNET_CHAIN_ID,
    rpcUrl: env.NEXT_PUBLIC_ARC_RPC_URL ?? ARC_TESTNET_RPC_URL,
    explorerUrl: env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? ARC_TESTNET_EXPLORER_URL,
    stablecoins: {
      USDC: normalizeAddress(
        env.NEXT_PUBLIC_ARC_USDC_ADDRESS || env.ARC_USDC_ADDRESS || ARC_USDC_ADDRESS,
      ),
      EURC: ARC_TESTNET_EURC_ADDRESS,
    },
  };
}

export function normalizeAddress(address: string): `0x${string}` {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid EVM address: ${address}`);
  }
  return address as `0x${string}`;
}

export function arcExplorerAddressUrl(
  address: `0x${string}`,
  config: ArcNetworkConfig = getArcNetworkConfig(),
): string {
  return `${config.explorerUrl.replace(/\/$/, "")}/address/${address}`;
}
