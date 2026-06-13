import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Standalone config for the Base Sepolia "Try it" widget (browser wallet only).
 */
export const demoWagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: false,
});

/** Circle's official USDC on Base Sepolia (6 decimals). */
export const USDC_BASE_SEPOLIA =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

export const BASE_SEPOLIA_ID = baseSepolia.id; // 84532
export const EXPLORER_TX = "https://sepolia.basescan.org/tx";
/** Circle's USDC faucet (select "Base Sepolia"). */
export const USDC_FAUCET = "https://faucet.circle.com";
