"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useCallback, useState } from "react";
import type { PaymentPayload } from "@/lib/payload";
import { ARC_EXPLORER_URL } from "@/lib/constants";
import {
  flowAttachSource,
  flowBroadcast,
  flowPollStatus,
  flowPrepare,
  flowQuote,
  flowStart,
  getFlowStatus,
  signAndBroadcastEvm,
  type FlowQuote,
} from "@/lib/flow";

export type PaymentStep =
  | "idle"
  | "authorizing"
  | "routing"
  | "quoting"
  | "signing"
  | "settling"
  | "success"
  | "error";

export interface PaymentResult {
  txHash?: string;
  explorerUrl?: string;
  mode: "flow" | "dynamic" | "stub";
  quote?: FlowQuote;
  flowTransactionId?: string;
  settlementCompleted?: boolean;
}

export function useFlowPayment(fromTokenAddress: string) {
  const { primaryWallet } = useDynamicContext();
  const [step, setStep] = useState<PaymentStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [quote, setQuote] = useState<FlowQuote | null>(null);

  const executePayment = useCallback(
    async (payload: PaymentPayload, onAuthorized?: () => Promise<boolean>) => {
      setStep("authorizing");
      setError(null);
      setResult(null);
      setQuote(null);

      try {
        if (onAuthorized) {
          const ok = await onAuthorized();
          if (!ok) {
            setStep("error");
            setError("Biometric authorization failed");
            return null;
          }
        }

        const flowStatus = await getFlowStatus().catch(() => ({
          configured: false,
        }));

        if (flowStatus.configured) {
          if (!primaryWallet || !isEthereumWallet(primaryWallet)) {
            setStep("error");
            setError("Connect your Dynamic wallet before paying");
            return null;
          }

          setStep("routing");

          const address = primaryWallet.address;
          const network = await primaryWallet.getNetwork();
          const chainId = String(
            network ?? process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? "5042002",
          );

          const started = await flowStart(
            payload.intent_id,
            payload.amount,
            payload.recipient,
          );

          await flowAttachSource(payload.intent_id, address, chainId);

          setStep("quoting");
          const quoteResult = await flowQuote(
            payload.intent_id,
            fromTokenAddress,
          );
          setQuote(quoteResult);

          setStep("signing");
          const prepared = await flowPrepare(payload.intent_id);
          const walletClient = await primaryWallet.getWalletClient(chainId);
          const txHash = await signAndBroadcastEvm(
            walletClient,
            prepared.signing_payload,
          );

          await flowBroadcast(payload.intent_id, txHash);

          setStep("settling");
          let completed = false;
          for (let i = 0; i < 40; i += 1) {
            const status = await flowPollStatus(payload.intent_id);
            if (status.completed) {
              completed = true;
              break;
            }
            if (
              status.settlement_state === "failed" ||
              status.execution_state === "failed"
            ) {
              throw new Error("Flow settlement failed");
            }
            await new Promise((r) => setTimeout(r, 3000));
          }

          if (!completed) {
            throw new Error("Flow settlement timed out — check webhook status");
          }

          const paymentResult: PaymentResult = {
            txHash,
            explorerUrl: `${ARC_EXPLORER_URL}/tx/${txHash}`,
            mode: "flow",
            quote: quoteResult,
            flowTransactionId: started.transaction_id,
            settlementCompleted: true,
          };
          setStep("success");
          setResult(paymentResult);
          return paymentResult;
        }

        setStep("error");
        setError(
          "Flow is not configured. Set DYNAMIC_ENV_ID and DYNAMIC_API_TOKEN.",
        );
        return null;
      } catch (err) {
        setStep("error");
        setError(err instanceof Error ? err.message : "Payment failed");
        return null;
      }
    },
    [primaryWallet, fromTokenAddress],
  );

  return { step, error, result, quote, executePayment };
}
