import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { arcTestnet } from "@/integrations/arc/chain";
import {
  ARC_CHAIN_ID,
  ARC_EXPLORER_URL,
  ARC_RPC_URL,
  ARC_USDC_ADDRESS,
} from "@/lib/constants";

/**
 * Standalone config for the Arc Testnet "Try it" widget (browser wallet only).
 */
export const demoWagmiConfig = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URL),
  },
  ssr: false,
});

/** Circle's official USDC on Arc Testnet (6 decimals). */
export const USDC_ARC_TESTNET = ARC_USDC_ADDRESS as `0x${string}`;

export const ARC_TESTNET_CHAIN_ID = ARC_CHAIN_ID;
export const EXPLORER_TX = `${ARC_EXPLORER_URL.replace(/\/$/, "")}/tx`;
/** Circle faucet — select Arc Testnet. */
export const USDC_FAUCET = "https://faucet.circle.com";

/** ERC-20 USDC uses 6 decimals on Arc (not the chain native 18-decimal gas unit). */
export const USDC_DECIMALS = 6;
