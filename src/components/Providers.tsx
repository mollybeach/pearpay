"use client";

import { useEffect, useState } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { DYNAMIC_ENVIRONMENT_ID } from "@/lib/constants";
import { queryClient, wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // The Dynamic SDK store only exists client-side, and children may call Dynamic
  // hooks (useAuthMode, etc.). Gate on `mounted` FIRST so children never render
  // during SSR / static prerender — otherwise the build throws
  // "Store not initialized" when no env id is configured (e.g. CI without
  // secrets). useEffect only runs in the browser, so `mounted` is always false
  // during SSG.
  if (!mounted) {
    return (
      <div className="min-h-screen bg-ambient" aria-busy="true" aria-label="Loading" />
    );
  }

  // No Dynamic env configured: render the app without the provider. Safe here
  // because we are past SSR (mounted === true), so no Dynamic hook runs on the
  // server.
  if (!DYNAMIC_ENVIRONMENT_ID) {
    return <>{children}</>;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        appName: "PearPay",
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
