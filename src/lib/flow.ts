/**
 * Fireblocks Flow — client-side EVM signing.
 * Server handles checkout lifecycle via /api/flow routes.
 */

import { parseAbi, type WalletClient } from "viem";
import { waitForTransactionReceipt } from "viem/actions";

export interface EvmSigningPayload {
  chainName?: string;
  chainId?: string;
  evmTransaction?: {
    to: string;
    data: string;
    value: string;
    gasLimit?: string;
  };
  evmApproval?: {
    tokenAddress: string;
    spenderAddress: string;
    amount: string;
  };
}

export interface FlowQuote {
  from_amount?: string;
  to_amount?: string;
  fees_usd?: string;
  estimated_time_sec?: number;
}

async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { detail?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.detail ?? data.error ?? "Flow request failed");
  }
  return data;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const data = (await res.json()) as T & { detail?: string };
  if (!res.ok) {
    throw new Error(data.detail ?? "Flow request failed");
  }
  return data;
}

export async function signAndBroadcastEvm(
  walletClient: WalletClient,
  signingPayload: EvmSigningPayload,
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("No wallet account available");

  if (signingPayload.evmApproval) {
    const { tokenAddress, spenderAddress, amount } = signingPayload.evmApproval;
    const approvalHash = await walletClient.writeContract({
      account,
      address: tokenAddress as `0x${string}`,
      abi: parseAbi(["function approve(address,uint256) returns (bool)"]),
      functionName: "approve",
      args: [spenderAddress as `0x${string}`, BigInt(amount)],
      chain: null,
    });
    await waitForTransactionReceipt(walletClient, { hash: approvalHash });
  }

  const tx = signingPayload.evmTransaction;
  if (!tx) throw new Error("No EVM transaction in signing payload");

  return walletClient.sendTransaction({
    account,
    to: tx.to as `0x${string}`,
    data: tx.data as `0x${string}`,
    value: BigInt(tx.value ?? "0"),
    chain: null,
  });
}

export const NATIVE_TOKEN = "0x0000000000000000000000000000000000000000";

export async function flowStart(
  intentId: string,
  amount: number,
  recipient: string,
): Promise<{ transaction_id: string }> {
  return apiPost("/api/flow/payment/start", {
    intent_id: intentId,
    amount,
    recipient,
  });
}

export async function flowAttachSource(
  intentId: string,
  fromAddress: string,
  fromChainId: string,
): Promise<void> {
  await apiPost("/api/flow/payment/source", {
    intent_id: intentId,
    from_address: fromAddress,
    from_chain_id: fromChainId,
    from_chain_name: "EVM",
  });
}

export async function flowQuote(
  intentId: string,
  fromTokenAddress: string,
): Promise<FlowQuote> {
  return apiPost("/api/flow/payment/quote", {
    intent_id: intentId,
    from_token_address: fromTokenAddress,
  });
}

export async function flowPrepare(
  intentId: string,
): Promise<{ signing_payload: EvmSigningPayload }> {
  return apiPost("/api/flow/payment/prepare", {
    intent_id: intentId,
  });
}

export async function flowBroadcast(
  intentId: string,
  txHash: string,
): Promise<void> {
  await apiPost("/api/flow/payment/broadcast", {
    intent_id: intentId,
    tx_hash: txHash,
  });
}

export async function flowPollStatus(intentId: string): Promise<{
  completed: boolean;
  settlement_state?: string;
  execution_state?: string;
}> {
  return apiGet(`/api/flow/payment/status/${intentId}`);
}

export async function getFlowStatus(): Promise<{ configured: boolean }> {
  return apiGet("/api/flow/status");
}
