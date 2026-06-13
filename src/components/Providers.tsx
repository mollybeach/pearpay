"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DYNAMIC_ENVIRONMENT_ID } from "@/lib/constants";

export function Providers({ children }: { children: React.ReactNode }) {
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
      {children}
    </DynamicContextProvider>
  );
}
