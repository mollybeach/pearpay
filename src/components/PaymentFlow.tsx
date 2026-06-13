"use client";

import { useCallback, useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { PaymentCard } from "./PaymentCard";
import { DynamicWalletButton } from "./DynamicWalletButton";
import { useFlowPayment } from "@/hooks/useFlowPayment";
import { usePayment } from "@/hooks/usePayment";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import type { PaymentPayload } from "@/lib/payload";
import { DYNAMIC_ENVIRONMENT_ID, FLOW_SOURCE_TOKENS } from "@/lib/constants";

interface PaymentFlowProps {
  payload: PaymentPayload;
}

function StepIndicator({
  step,
  quote,
}: {
  step: string;
  quote?: {
    from_amount?: string;
    to_amount?: string;
    fees_usd?: string;
    estimated_time_sec?: number;
  } | null;
}) {
  const labels: Record<string, string> = {
    authorizing: "Waiting for Face ID…",
    routing: "Routing cross-chain via Flow…",
    quoting: "Getting swap quote…",
    signing: "Sign with your wallet…",
    settling: "Settling USDC on Arc…",
    success: "Payment complete",
    error: "Payment failed",
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {step === "success" ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-3xl text-white shadow-lg">
          ✓
        </div>
      ) : step === "error" ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-3xl text-white">
          ✕
        </div>
      ) : (
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
      )}
      <p className="text-lg font-medium text-zinc-700">
        {labels[step] ?? "Processing…"}
      </p>
      {quote && ["quoting", "signing", "settling"].includes(step) && (
        <p className="text-center text-xs text-zinc-500">
          Flow: send {quote.from_amount} → settle {quote.to_amount} USDC on Arc
          {quote.fees_usd ? ` · fees $${quote.fees_usd}` : ""}
        </p>
      )}
    </div>
  );
}

function PaymentFlowInner({ payload }: PaymentFlowProps) {
  const { primaryWallet } = useDynamicContext();
  const [sourceToken, setSourceToken] = useState<string>(
    FLOW_SOURCE_TOKENS.native.address,
  );
  const { step, error, result, quote, executePayment } =
    useFlowPayment(sourceToken);
  const {
    authenticate,
    status: webauthnStatus,
    error: webauthnError,
  } = useWebAuthn();

  const walletConnected =
    primaryWallet != null && isEthereumWallet(primaryWallet);

  const handlePay = useCallback(async () => {
    await executePayment(payload, authenticate);
  }, [executePayment, payload, authenticate]);

  const processingSteps = [
    "authorizing",
    "routing",
    "quoting",
    "signing",
    "settling",
  ];

  const isProcessing = processingSteps.includes(step);
  const isDone = step === "success" || step === "error";

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <PaymentCard payload={payload} />

      {!isDone && !isProcessing && (
        <div className="space-y-3">
          <DynamicWalletButton />
          {!walletConnected && (
            <p className="text-center text-xs text-amber-600">
              Connect a funded wallet to pay via Flow
            </p>
          )}
          <label className="block text-xs text-zinc-500">
            Pay with
            <select
              value={sourceToken}
              onChange={(e) => setSourceToken(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            >
              {Object.values(FLOW_SOURCE_TOKENS).map((token) => (
                <option key={token.address} value={token.address}>
                  {token.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handlePay}
            disabled={webauthnStatus === "authenticating" || !walletConnected}
            className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50"
          >
            {webauthnStatus === "authenticating"
              ? "Confirm with Face ID…"
              : "Pay with Face ID + Flow"}
          </button>
          <p className="text-center text-xs text-zinc-400">
            Pay from any chain · Flow settles USDC on Arc
          </p>
        </div>
      )}

      {isProcessing && <StepIndicator step={step} quote={quote} />}
      {isDone && <StepIndicator step={step} quote={quote} />}

      {(error || webauthnError) && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error ?? webauthnError}
        </p>
      )}

      {result?.explorerUrl && (
        <a
          href={result.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl border border-zinc-200 bg-white py-3 text-center text-sm font-medium text-blue-600 hover:bg-zinc-50"
        >
          View on Arc Explorer →
        </a>
      )}

      {result?.mode === "flow" && step === "success" && (
        <p className="text-center text-xs text-emerald-600">
          Settled via Fireblocks Flow on Arc
        </p>
      )}
    </div>
  );
}

export function PaymentFlow({ payload }: PaymentFlowProps) {
  if (!DYNAMIC_ENVIRONMENT_ID) {
    return <PaymentFlowStubOnly payload={payload} />;
  }
  return <PaymentFlowInner payload={payload} />;
}

function PaymentFlowStubOnly({ payload }: PaymentFlowProps) {
  const {
    authenticate,
    status: webauthnStatus,
    error: webauthnError,
  } = useWebAuthn();
  const { step, error, result, executePayment } = usePayment();

  const handlePay = useCallback(async () => {
    await executePayment(payload, authenticate);
  }, [executePayment, payload, authenticate]);

  const isProcessing = ["authorizing", "shielding", "settling"].includes(step);
  const isDone = step === "success" || step === "error";

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <PaymentCard payload={payload} />
      {!isDone && !isProcessing && (
        <button
          type="button"
          onClick={handlePay}
          disabled={webauthnStatus === "authenticating"}
          className="w-full rounded-2xl bg-black py-4 text-lg font-semibold text-white"
        >
          Pay with Face ID
        </button>
      )}
      {isProcessing && <StepIndicator step={step} />}
      {isDone && <StepIndicator step={step} />}
      {(error || webauthnError) && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error ?? webauthnError}
        </p>
      )}
      {result?.explorerUrl && (
        <a
          href={result.explorerUrl}
          className="block text-center text-sm text-blue-600"
        >
          View on Arc Explorer →
        </a>
      )}
      <p className="text-center text-xs text-amber-600">
        Demo mode — set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID for live Flow
      </p>
    </div>
  );
}
