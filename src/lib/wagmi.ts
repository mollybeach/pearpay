import { http, createConfig } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { arcTestnet } from "viem/chains";
import { QueryClient } from "@tanstack/react-query";
import { ARC_RPC_URL } from "@/lib/constants";

/**
 * App-wide wagmi config for Dynamic + Flow.
 * Connectors are injected by DynamicWagmiConnector — do not add injected() here.
 */
export const wagmiConfig = createConfig({
  chains: [base, mainnet, arcTestnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
    [arcTestnet.id]: http(ARC_RPC_URL),
  },
  ssr: false,
});

export const queryClient = new QueryClient();
