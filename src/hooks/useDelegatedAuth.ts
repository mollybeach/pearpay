"use client";

import { useCallback, useState } from "react";
import {
  DelegationError,
  useDynamicContext,
  useWalletDelegation,
} from "@dynamic-labs/sdk-react-core";
import { useWebAuthn } from "./useWebAuthn";

/**
 * Delegated-auth state machine:
 *   idle -> authenticating (FaceID) -> delegating -> delegated
 * Any failure transitions to `error` with a human-readable message.
 */
export type DelegatedAuthStatus =
  | "idle"
  | "authenticating"
  | "delegating"
  | "delegated"
  | "error";

export function useDelegatedAuth() {
  const { primaryWallet, user } = useDynamicContext();
  const { delegateKeyShares } = useWalletDelegation();
  const webauthn = useWebAuthn();

  const [status, setStatus] = useState<DelegatedAuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  /**
   * One tap: biometric approval, then hand signing authority to our backend.
   *
   * 1. WebAuthn (FaceID / TouchID) proves the human is present.
   * 2. delegateKeyShares() ships the encrypted MPC share to our server via the
   *    `wallet.delegation.created` webhook. Calling it with no args delegates
   *    every eligible embedded wallet on this user; pass an explicit
   *    `[{ chainName: ChainEnum.Evm, accountAddress }]` to scope it.
   */
  const authorizeAndDelegate = useCallback(async () => {
    setError(null);
    try {
      setStatus("authenticating");
      const ok = await webauthn.authenticate();
      if (!ok) throw new Error("Biometric authentication failed");

      if (!primaryWallet) {
        throw new Error("Connect a Dynamic embedded wallet first");
      }

      setStatus("delegating");
      await delegateKeyShares();

      setStatus("delegated");
      return true;
    } catch (err) {
      setStatus("error");
      if (err instanceof DelegationError) {
        setError(
          `${err.failureCount} of ${
            err.successCount + err.failureCount
          } wallet(s) failed to delegate`,
        );
      } else {
        setError(err instanceof Error ? err.message : "Delegation failed");
      }
      return false;
    }
  }, [delegateKeyShares, primaryWallet, webauthn]);

  return {
    status,
    error,
    address: primaryWallet?.address,
    userId: user?.userId,
    authorizeAndDelegate,
    reset: () => {
      setStatus("idle");
      setError(null);
    },
  };
}
