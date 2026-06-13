import {
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TokenId,
  TopicId,
  TopicMessageSubmitTransaction,
  TransferTransaction,
} from "@hashgraph/sdk";
import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";

const log = logger.scoped("hedera");

/**
 * Hedera integration — Pear Pay's primary settlement rail.
 *
 * Uses three Hedera-native services:
 *   - HTS: settle in USDC issued natively on Hedera (an HTS token), HBAR for gas.
 *   - HCS: write a tamper-proof, ordered audit receipt for every payment.
 *   - (EVM) PearPayEscrow.sol deploys to Hedera's Smart Contract Service.
 *
 * Hedera gives sub-cent fees and 3-5s finality, which is ideal for
 * conversational payments and nanopayments. Calls fall back to deterministic
 * local receipts when no operator is configured outside production.
 */

let cachedClient: Client | null = null;

function isConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.HEDERA_OPERATOR_ID && env.HEDERA_OPERATOR_KEY);
}

function hederaClient(): Client {
  if (cachedClient) return cachedClient;
  const env = getEnv();
  const client =
    env.HEDERA_NETWORK === "mainnet"
      ? Client.forMainnet()
      : Client.forTestnet();
  client.setOperator(
    AccountId.fromString(env.HEDERA_OPERATOR_ID!),
    PrivateKey.fromString(env.HEDERA_OPERATOR_KEY!),
  );
  cachedClient = client;
  return client;
}

/** Resolve a recipient reference (Hedera account id or EVM alias) to an AccountId. */
function toAccountId(ref: string): AccountId {
  if (/^\d+\.\d+\.\d+$/.test(ref)) return AccountId.fromString(ref);
  // EVM 0x address → Hedera account alias.
  return AccountId.fromEvmAddress(0, 0, ref);
}

export interface HederaSettlement {
  /** Hedera transaction id, e.g. "0.0.1234@1718200000.000000000". */
  transactionId: string;
  status: "settled" | "pending";
  network: string;
}

/**
 * Settle a USDC transfer on Hedera using the Hedera Token Service (HTS).
 * `amount` is in USDC base units (6 decimals), matching Hedera USDC.
 */
export async function settleUsdcOnHedera(params: {
  to: string;
  amount: UsdcAmount;
  from?: string;
}): Promise<HederaSettlement> {
  const env = getEnv();

  if (!isConfigured() || !env.HEDERA_USDC_TOKEN_ID) {
    assertConfiguredForProduction("hedera", false);
    const stubId = `0.0.0@${Math.floor(Date.now() / 1000)}.000000000`;
    log.debug("hedera local HTS settlement", {
      amount: formatUsdc(params.amount),
    });
    return { transactionId: stubId, status: "settled", network: "local" };
  }

  const client = hederaClient();
  const tokenId = TokenId.fromString(env.HEDERA_USDC_TOKEN_ID);
  const operator = client.operatorAccountId!;
  const fromAccount = params.from ? toAccountId(params.from) : operator;
  const toAccount = toAccountId(params.to);
  const units = Number(params.amount);

  const tx = await new TransferTransaction()
    .addTokenTransfer(tokenId, fromAccount, -units)
    .addTokenTransfer(tokenId, toAccount, units)
    .execute(client);
  const receipt = await tx.getReceipt(client);

  log.info("hedera HTS settlement", {
    txId: tx.transactionId?.toString(),
    status: receipt.status.toString(),
  });
  return {
    transactionId: tx.transactionId!.toString(),
    status: receipt.status.toString() === "SUCCESS" ? "settled" : "pending",
    network: env.HEDERA_NETWORK,
  };
}

/** Settle a native HBAR transfer (when paying in Hedera's own token). */
export async function settleHbar(params: {
  to: string;
  hbar: number;
  from?: string;
}): Promise<HederaSettlement> {
  const env = getEnv();
  if (!isConfigured()) {
    assertConfiguredForProduction("hedera", false);
    return {
      transactionId: `0.0.0@${Math.floor(Date.now() / 1000)}.000000000`,
      status: "settled",
      network: "local",
    };
  }
  const client = hederaClient();
  const fromAccount = params.from
    ? toAccountId(params.from)
    : client.operatorAccountId!;
  const tx = await new TransferTransaction()
    .addHbarTransfer(fromAccount, new Hbar(-params.hbar))
    .addHbarTransfer(toAccountId(params.to), new Hbar(params.hbar))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  return {
    transactionId: tx.transactionId!.toString(),
    status: receipt.status.toString() === "SUCCESS" ? "settled" : "pending",
    network: env.HEDERA_NETWORK,
  };
}

export interface AuditReceipt {
  kind: "settlement" | "escrow" | "claim";
  from?: string;
  to?: string;
  amount?: string;
  memo?: string;
  rail?: string;
}

/**
 * Write a tamper-proof payment receipt to the Hedera Consensus Service (HCS).
 * Produces an immutable, ordered audit trail for every Pear Pay transaction.
 */
export async function logToConsensus(
  receipt: AuditReceipt,
): Promise<{ topicId: string; sequenceNumber?: number }> {
  const env = getEnv();
  const message = JSON.stringify({ ...receipt, ts: Date.now() });

  if (!isConfigured() || !env.HEDERA_HCS_TOPIC_ID) {
    assertConfiguredForProduction("hedera", false);
    log.debug("hedera local HCS audit log", { kind: receipt.kind });
    return { topicId: env.HEDERA_HCS_TOPIC_ID ?? "0.0.0" };
  }

  const client = hederaClient();
  const tx = await new TopicMessageSubmitTransaction({
    topicId: TopicId.fromString(env.HEDERA_HCS_TOPIC_ID),
    message,
  }).execute(client);
  const r = await tx.getReceipt(client);

  log.info("hedera HCS audit logged", {
    kind: receipt.kind,
    seq: r.topicSequenceNumber?.toString(),
  });
  return {
    topicId: env.HEDERA_HCS_TOPIC_ID,
    sequenceNumber: r.topicSequenceNumber
      ? Number(r.topicSequenceNumber)
      : undefined,
  };
}
