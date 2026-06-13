"use client";

import { useCallback, useState } from "react";
import type { PaymentPayload } from "@/lib/payload";
import { ARC_EXPLORER_URL } from "@/lib/constants";

export type PaymentStep =
  | "idle"
  | "authorizing"
  | "shielding"
  | "settling"
  | "success"
  | "error";

export interface PaymentResult {
  txHash?: string;
  explorerUrl?: string;
  mode: "dynamic" | "stub";
}

export function usePayment() {
  const [step, setStep] = useState<PaymentStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const executePayment = useCallback(
    async (payload: PaymentPayload, onAuthorized?: () => Promise<boolean>) => {
      setStep("authorizing");
      setError(null);
      setResult(null);

      try {
        if (onAuthorized) {
          const authorized = await onAuthorized();
          if (!authorized) {
            setStep("error");
            setError("Biometric authorization failed");
            return null;
          }
        }

        setStep("shielding");
        await fetch("/api/privacy/shield", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payload.amount,
            recipient: payload.recipient,
            intent_id: payload.intent_id,
          }),
        });

        await new Promise((r) => setTimeout(r, 1500));
        setStep("settling");

        const dynamicConfigured = Boolean(
          process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
        );

        if (dynamicConfigured) {
          setStep("success");
          setResult({ mode: "dynamic" });
          return { mode: "dynamic" as const };
        }

        const stubHash = `0x${payload.intent_id.replace(/-/g, "").slice(0, 64)}`;
        const paymentResult: PaymentResult = {
          txHash: stubHash,
          explorerUrl: `${ARC_EXPLORER_URL}/tx/${stubHash}`,
          mode: "stub",
        };
        setStep("success");
        setResult(paymentResult);
        return paymentResult;
      } catch (err) {
        setStep("error");
        setError(err instanceof Error ? err.message : "Payment failed");
        return null;
      }
    },
    [],
  );

  return { step, error, result, executePayment, reset: () => setStep("idle") };
}
