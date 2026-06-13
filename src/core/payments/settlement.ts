import type { UsdcAmount } from "@/lib/money";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc";
import { settleUsdc } from "@/integrations/arc";
import { privateTransfer } from "@/integrations/unlink";

/**
 * Settlement rail selection.
 *
 * Pear Pay picks the optimal settlement rail per payment:
 *   - arc     → default: chain-abstracted Circle-native USDC hub.
 *   - unlink  → private transfers (amounts and counterparties hidden).
 */
export type Rail = "arc" | "unlink";

export interface RailSelectionInput {
  amount: UsdcAmount;
  isPrivate: boolean;
  /** Force a specific rail (e.g. recipient already lives on Arc). */
  prefer?: Rail;
}

export function selectRail(input: RailSelectionInput): Rail {
  if (input.isPrivate) return "unlink";
  if (input.prefer) return input.prefer;
  return "arc";
}

export interface RailSettlementParams {
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  amount: UsdcAmount;
  /** Source chain detected from sender/channel context. */
  sourceChainId?: number;
  /** Destination settlement chain, defaulting to Arc testnet. */
  chainId?: number;
  memo?: string;
  idempotencyKey?: string;
}

export interface RailSettlement {
  rail: Rail;
  /** EVM tx hash when the rail is EVM-based (Arc). */
  txHash?: `0x${string}`;
  /** Rail-native reference (Unlink note id, Arc settlement id). */
  ref: string;
  status: string;
  sourceChainId?: number;
  destinationChainId?: number;
  tokenAddress?: `0x${string}`;
  route?: "arc-native" | "source-to-arc";
}

/** Settle a single leg on the chosen rail. */
export async function settleOnRail(
  rail: Rail,
  params: RailSettlementParams,
): Promise<RailSettlement> {
  if (rail === "unlink") {
    const r = await privateTransfer({
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      amount: params.amount,
      chainId: params.chainId ?? params.sourceChainId ?? ARC_TESTNET_CHAIN_ID,
    });
    return { rail, ref: r.noteId, status: r.status };
  }

  const r = await settleUsdc({
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    amount: params.amount,
    sourceChainId: params.sourceChainId,
    chainId: params.chainId,
    idempotencyKey: params.idempotencyKey,
  });
  return {
    rail: "arc",
    txHash: r.txHash,
    ref: r.settlementId,
    status: r.status,
    sourceChainId: r.sourceChainId,
    destinationChainId: r.destinationChainId,
    tokenAddress: r.tokenAddress,
    route: r.route,
  };
}
