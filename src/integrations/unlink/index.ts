import type { UnlinkClient } from "@unlink-xyz/sdk";
import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";
import { usdcAddress } from "@/integrations/arc";

const log = logger.scoped("unlink");

/**
 * Unlink integration — the embedded privacy SDK (`@unlink-xyz/sdk`).
 *
 * When a user adds "privately" to a payment, funds are routed through Unlink's
 * shielded pool so the **amount, balances, and counterparties stay hidden**
 * on-chain. We use the backend client (`createUnlink`) with an account derived
 * from a server mnemonic and the four private primitives:
 *   - deposit()  → shield public USDC into a private balance
 *   - transfer() → move USDC privately (amount + recipient unlinkable)
 *   - withdraw() → exit to a fresh public EOA (breaks the funding link)
 *
 * Without `UNLINK_API_KEY` / engine URL / account it runs in a deterministic
 * stub so local demos and tests work offline; production fails fast.
 */

export interface PrivateTransferRequest {
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  amount: UsdcAmount;
  chainId: number;
}

export interface PrivateTransferReceipt {
  /** Opaque private-transfer handle; reveals nothing about amount or parties. */
  noteId: string;
  status: "shielded" | "settled";
}

function isConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.UNLINK_API_KEY && env.UNLINK_ENGINE_URL && env.UNLINK_ACCOUNT_MNEMONIC,
  );
}

function requireConfigured() {
  const configured = isConfigured();
  assertConfiguredForProduction("unlink", configured);
  return configured;
}

// Cache the registered client across calls within a server instance.
let clientPromise: Promise<UnlinkClient> | null = null;

/** Lazily construct (and register) the real Unlink backend client. */
async function getClient(): Promise<UnlinkClient> {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const env = getEnv();
    // Dynamic import keeps the ZK-crypto SDK out of any client bundle and out
    // of the stub path entirely.
    const { createUnlink, unlinkAccount } = await import("@unlink-xyz/sdk");
    const account = unlinkAccount.fromMnemonic({
      mnemonic: env.UNLINK_ACCOUNT_MNEMONIC!,
    });
    const client = createUnlink({
      engineUrl: env.UNLINK_ENGINE_URL!,
      apiKey: env.UNLINK_API_KEY!,
      account,
    });
    await client.ensureRegistered();
    log.info("unlink client registered", { engine: env.UNLINK_ENGINE_URL });
    return client;
  })();
  return clientPromise;
}

/** Shield public USDC into a private balance (Unlink `deposit()`). */
export async function deposit(
  fromAddress: `0x${string}`,
  amount: UsdcAmount,
  chainId: number,
): Promise<{ noteId: string }> {
  if (!requireConfigured()) {
    return { noteId: `note_${fromAddress.slice(2, 10)}_${amount}` };
  }
  const client = await getClient();
  const res = await client.deposit({
    token: usdcAddress(chainId),
    amount: formatUsdc(amount),
  });
  return { noteId: res.txId };
}

/**
 * Privately transfer USDC between accounts (Unlink `transfer()`). The amount
 * and counterparty are confidential — this is the primitive used by the
 * "send X privately" rail.
 */
export async function privateTransfer(
  req: PrivateTransferRequest,
): Promise<PrivateTransferReceipt> {
  if (!requireConfigured()) {
    log.debug("unlink stub private transfer", {
      amount: formatUsdc(req.amount),
    });
    return {
      noteId: `note_${req.fromAddress.slice(2, 8)}${req.toAddress.slice(2, 8)}`,
      status: "shielded",
    };
  }

  const client = await getClient();
  const res = await client.transfer({
    token: usdcAddress(req.chainId),
    amount: formatUsdc(req.amount),
    recipientAddress: req.toAddress,
  });
  log.info("unlink private transfer complete", { txId: res.txId });
  return {
    noteId: res.txId,
    status: res.status === "settled" ? "settled" : "shielded",
  };
}

/**
 * Withdraw a private balance to a public EOA (Unlink `withdraw()`). Used to exit
 * the shielded pool via an address unlinkable from the original funder.
 */
export async function withdraw(
  toAddress: `0x${string}`,
  amount: UsdcAmount,
  chainId: number,
): Promise<{ txId: string }> {
  if (!requireConfigured()) {
    return {
      txId: `0x${Buffer.from(`${toAddress}${amount}`).toString("hex").padEnd(64, "0").slice(0, 64)}`,
    };
  }
  const client = await getClient();
  const res = await client.withdraw({
    recipientEvmAddress: toAddress,
    token: usdcAddress(chainId),
    amount: formatUsdc(amount),
  });
  return { txId: res.txId };
}

/** Test/HMR helper: drop the cached client so config changes take effect. */
export function resetUnlinkClient(): void {
  clientPromise = null;
}
