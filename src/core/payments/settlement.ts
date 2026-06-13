import { formatUsdcDisplay, type UsdcAmount } from "@/lib/money";
import { settleUsdc } from "@/integrations/arc";
import { privateTransfer } from "@/integrations/unlink";
import { logToConsensus, settleUsdcOnHedera } from "@/integrations/hedera";

/**
 * Settlement rail selection.
 *
 * Pear Pay no longer routes through a cross-chain aggregator; instead it picks
 * the optimal settlement rail per payment and records a tamper-proof receipt on
 * the Hedera Consensus Service (HCS) regardless of which rail settled funds.
 *
 *   - hedera  → default: sub-cent fees, 3-5s finality (conversational + nano).
 *   - arc     → Circle-native USDC flows / other EVM destinations.
 *   - unlink  → private transfers (amounts and counterparties hidden).
 */
export type Rail = "hedera" | "arc" | "unlink";

export interface RailSelectionInput {
  amount: UsdcAmount;
  isPrivate: boolean;
  /** Force a specific rail (e.g. recipient already lives on Arc). */
  prefer?: Rail;
}

export function selectRail(input: RailSelectionInput): Rail {
  if (input.isPrivate) return "unlink";
  if (input.prefer) return input.prefer;
  return "hedera";
}

export interface RailSettlementParams {
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  amount: UsdcAmount;
  chainId: number;
  memo?: string;
  idempotencyKey?: string;
}

export interface RailSettlement {
  rail: Rail;
  /** EVM tx hash when the rail is EVM-based (Arc). */
  txHash?: `0x${string}`;
  /** Rail-native reference (Hedera tx id, Unlink note id, Arc settlement id). */
  ref: string;
  status: string;
}

/**
 * Settle a single leg on the chosen rail and write an HCS audit receipt.
 */
export async function settleOnRail(
  rail: Rail,
  params: RailSettlementParams,
): Promise<RailSettlement> {
  let settlement: RailSettlement;

  switch (rail) {
    case "unlink": {
      const r = await privateTransfer({
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        amount: params.amount,
        chainId: params.chainId,
      });
      settlement = { rail, ref: r.noteId, status: r.status };
      break;
    }
    case "arc": {
      const r = await settleUsdc({
        fromAddress: params.fromAddress,
        toAddress: params.toAddress,
        amount: params.amount,
        chainId: params.chainId,
        idempotencyKey: params.idempotencyKey,
      });
      settlement = {
        rail,
        txHash: r.txHash,
        ref: r.settlementId,
        status: r.status,
      };
      break;
    }
    case "hedera":
    default: {
      const r = await settleUsdcOnHedera({
        from: params.fromAddress,
        to: params.toAddress,
        amount: params.amount,
      });
      settlement = { rail: "hedera", ref: r.transactionId, status: r.status };
      break;
    }
  }

  // Immutable, ordered audit trail for every settlement (HCS).
  await logToConsensus({
    kind: "settlement",
    from: params.fromAddress,
    to: params.toAddress,
    amount: formatUsdcDisplay(params.amount),
    memo: params.memo,
    rail: settlement.rail,
  });

  return settlement;
}
