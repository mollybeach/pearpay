"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export function DynamicWalletButton() {
  const { setShowAuthFlow, primaryWallet } = useDynamicContext();

  if (primaryWallet) return null;

  return (
    <button
      type="button"
      onClick={() => setShowAuthFlow(true)}
      className="w-full rounded-2xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
    >
      Connect Wallet
    </button>
  );
}
