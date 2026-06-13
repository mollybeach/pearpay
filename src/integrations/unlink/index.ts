import type { UnlinkClient } from "@unlink-xyz/sdk/client";
import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";
import { usdcAddress } from "@/integrations/arc";
import {
  getArcPublicClient,
  getArcSignerAccount,
  getArcWalletClient,
} from "@/integrations/arc/client";

const log = logger.scoped("unlink");

/**
 * Unlink integration — the embedded privacy SDK (`@unlink-xyz/sdk@0.3.x`).
 *
 * When a user adds "privately" to a payment, funds are routed through Unlink's
 * shielded pool so the **amount, balances, and counterparties stay hidden**
 * on-chain. The private rail delivers to a public recipient with two primitives:
 *   - deposit()  → shield public USDC into a private balance (Permit2 + ERC-4337
 *                  execution intent; signed by the server EVM wallet)
 *   - withdraw() → exit the pool to the recipient's EOA, unlinkable from the
 *                  original funder (this is what "send privately" delivers)
 *   - transfer() → optional private hop between two Unlink (bech32m) accounts
 *
 * The Arc-testnet engine uses an ERC-4337 `execution_intent_v1` scheme, so the
 * SDK signs both the Permit2 deposit witness and the execution intent via an
 * EVM provider built from Pear Pay's Arc wallet client.
 *
 * Without `UNLINK_API_KEY` / engine URL / account it runs in a deterministic
 * stub so local demos and tests work offline; production fails fast.
 */

/** How long to wait for a shielded deposit/withdraw to reach a terminal state. */
const TX_TIMEOUT_MS = 180_000;
const TX_POLL_MS = 3_000;

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
    const { createUnlinkClient, account, evm } = await import(
      "@unlink-xyz/sdk/client"
    );
    const apiKey = env.UNLINK_API_KEY!;
    const client = createUnlinkClient({
      engineUrl: env.UNLINK_ENGINE_URL!,
      account: account.fromMnemonic({ mnemonic: env.UNLINK_ACCOUNT_MNEMONIC! }),
      // The server EVM wallet (Arc funder) signs the Permit2 deposit witness and
      // ERC-4337 execution intents required by the Arc engine.
      evm: evm.fromViem({
        // viem clients satisfy the SDK's structural Viem*Like interfaces.
        walletClient: getArcWalletClient() as never,
        publicClient: getArcPublicClient() as never,
        address: getArcSignerAccount().address,
      }),
      // The server account is pre-registered with the engine; no browser
      // registration round-trip is needed.
      register: async () => {},
      // The engine authenticates with our API key as a bearer token.
      authorizationToken: {
        provider: async () => ({
          token: apiKey,
          expiresAt: new Date(Date.now() + 3_600_000),
        }),
      },
    });
    await client.ensureRegistered();
    log.info("unlink client registered", { engine: env.UNLINK_ENGINE_URL });
    return client;
  })();
  return clientPromise;
}

/** Current shielded balance (base units) for a token. */
async function privateBalance(
  client: UnlinkClient,
  token: `0x${string}`,
): Promise<bigint> {
  const raw = await client.balanceOf(token);
  return raw ? BigInt(raw) : 0n;
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
  // `depositWithApproval` ensures the Permit2 ERC-20 allowance is in place and
  // confirmed before the shielded deposit is submitted. Amounts are base units.
  const handle = await client.depositWithApproval({
    token: usdcAddress(chainId),
    amount: amount.toString(),
  });
  const res = await handle.wait({
    timeoutMs: TX_TIMEOUT_MS,
    intervalMs: TX_POLL_MS,
  });
  return { noteId: res.txId };
}

/**
 * Privately transfer USDC to a recipient (the "send X privately" rail). Funds
 * are shielded into the pool, then withdrawn to the recipient's EOA, so the
 * amount, balances, and the funder→recipient link stay confidential on-chain.
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
  const token = usdcAddress(req.chainId);

  // Shield only the shortfall: top up the private balance if it can't already
  // cover the transfer, then exit to the recipient through the pool.
  const have = await privateBalance(client, token);
  if (have < req.amount) {
    const dep = await client.depositWithApproval({
      token,
      amount: (req.amount - have).toString(),
    });
    await dep.wait({ timeoutMs: TX_TIMEOUT_MS, intervalMs: TX_POLL_MS });
  }

  const handle = await client.withdraw({
    recipientEvmAddress: req.toAddress,
    token,
    amount: req.amount.toString(),
  });
  const res = await handle.wait({
    timeoutMs: TX_TIMEOUT_MS,
    intervalMs: TX_POLL_MS,
  });
  log.info("unlink private transfer complete", {
    txId: res.txId,
    status: res.status,
  });
  return {
    noteId: res.txHash ?? res.txId,
    status: res.status === "processed" ? "settled" : "shielded",
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
  const handle = await client.withdraw({
    recipientEvmAddress: toAddress,
    token: usdcAddress(chainId),
    amount: amount.toString(),
  });
  const res = await handle.wait({
    timeoutMs: TX_TIMEOUT_MS,
    intervalMs: TX_POLL_MS,
  });
  return { txId: res.txHash ?? res.txId };
}

/** Test/HMR helper: drop the cached client so config changes take effect. */
export function resetUnlinkClient(): void {
  clientPromise = null;
}
