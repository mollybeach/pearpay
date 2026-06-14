import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  type DelegationRecord,
  type SpendAuthorization,
  getDelegationByAddress,
  getDelegationRecord,
  markRevoked,
  recordSpend,
  saveDelegation,
  seal,
  unseal,
} from "./delegation-store";

const log = logger.scoped("dynamic:delegated");

/**
 * Delegated Access — the server acts on behalf of the user's embedded MPC
 * wallet after a single biometric approval, without prompting again.
 *
 * Lifecycle:
 *   1. Frontend: FaceID/WebAuthn -> delegateKeyShares() (Dynamic React SDK).
 *   2. Dynamic POSTs `wallet.delegation.created` to /api/webhooks/dynamic with
 *      the RSA-encrypted server key share + per-wallet API key.
 *   3. ingestDelegation() RSA-decrypts (Dynamic Node SDK), then seals to disk.
 *   4. delegatedSignMessageForWallet() unseals and signs autonomously — within
 *      the spend authorization captured at delegation time.
 *
 * The native `@dynamic-labs-wallet/*` packages ship a Rust N-API addon, so they
 * are dynamically imported inside functions (never at module top level) to keep
 * the Next.js build / SSR free of native-load side effects.
 */

/** Hybrid (RSA-OAEP-SHA256 + AES-256-GCM) envelope sent by Dynamic. */
export interface EncryptedDelegatedPayload {
  alg: string;
  iv: string;
  ct: string;
  tag: string;
  ek: string;
  kid?: string;
}

/** `data` block of a `wallet.delegation.created` webhook. */
export interface DelegationWebhookData {
  walletId: string;
  shareSetId?: string;
  userId?: string;
  walletAddress?: string;
  chainName?: string;
  encryptedDelegatedShare: EncryptedDelegatedPayload;
  encryptedWalletApiKey: EncryptedDelegatedPayload;
}

function rsaPrivateKeyPem(): string | null {
  const env = getEnv();
  const pem = env.DYNAMIC_DELEGATED_RSA_PRIVATE_KEY_PEM;
  if (!pem) return null;
  // .env stores PEMs with literal "\n"; restore real newlines for crypto.
  return pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
}

export function isDelegationConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.DYNAMIC_ENV_ID && env.DYNAMIC_API_TOKEN && rsaPrivateKeyPem(),
  );
}

/**
 * Decrypt the webhook envelope with our RSA private key and persist the sealed
 * materials. Returns null if decryption is not configured (stub/dev).
 */
export async function ingestDelegation(
  data: DelegationWebhookData,
  authorization?: SpendAuthorization,
): Promise<DelegationRecord | null> {
  const pem = rsaPrivateKeyPem();
  if (!pem) {
    log.warn("RSA private key not set; cannot decrypt delegation", {
      walletId: data?.walletId,
    });
    return null;
  }

  const { decryptDelegatedWebhookData } = await import(
    "@dynamic-labs-wallet/node"
  );

  const { decryptedDelegatedShare, decryptedWalletApiKey } =
    decryptDelegatedWebhookData({
      privateKeyPem: pem,
      encryptedDelegatedKeyShare: data.encryptedDelegatedShare,
      encryptedWalletApiKey: data.encryptedWalletApiKey,
    });

  const record: DelegationRecord = {
    walletId: data.walletId,
    shareSetId: data.shareSetId,
    userId: data.userId,
    address: ((data.walletAddress ?? "0x") as string).toLowerCase() as `0x${string}`,
    chainName: data.chainName ?? "EVM",
    sealed: seal({
      walletApiKey: decryptedWalletApiKey,
      keyShare: decryptedDelegatedShare,
    }),
    authorization,
    createdAt: Date.now(),
  };

  saveDelegation(record);
  log.info("delegation stored", {
    walletId: record.walletId,
    address: record.address,
  });
  return record;
}

export function revokeDelegation(walletId: string): void {
  markRevoked(walletId);
  log.info("delegation revoked", { walletId });
}

/** Throws if a charge would violate the delegation's spend authorization. */
export function assertWithinAuthorization(
  rec: DelegationRecord,
  amountUsd: number,
): void {
  const auth = rec.authorization;
  if (!auth) return; // unconstrained (demo wallets)
  if (Date.now() > auth.expiresAt) {
    throw new Error("delegation expired — user must re-authenticate");
  }
  if (auth.spentUsd + amountUsd > auth.maxAmountUsd) {
    throw new Error(
      `amount $${amountUsd} exceeds delegated authorization ` +
        `($${auth.spentUsd} spent of $${auth.maxAmountUsd})`,
    );
  }
}

/**
 * Sign a message with the user's delegated wallet — autonomously, server-side.
 *
 * @param message  EIP-191 plain message, or a 0x keccak256 hash when
 *                 `isFormatted` is true (e.g. an EIP-712 / x402 digest).
 */
export async function delegatedSignMessageForWallet(
  walletId: string,
  message: string,
  opts: { amountUsd?: number; isFormatted?: boolean } = {},
): Promise<{ signature: string; address: `0x${string}` } | null> {
  const rec = getDelegationRecord(walletId);
  if (!rec || rec.revokedAt) {
    log.warn("no active delegation for wallet", { walletId });
    return null;
  }
  if (opts.amountUsd != null) assertWithinAuthorization(rec, opts.amountUsd);
  if (!isDelegationConfigured()) return null;

  const env = getEnv();
  const secrets = unseal(rec.sealed);

  const { createDelegatedEvmWalletClient, delegatedSignMessage } = await import(
    "@dynamic-labs-wallet/node-evm"
  );

  const client = createDelegatedEvmWalletClient({
    environmentId: env.DYNAMIC_ENV_ID!,
    apiKey: env.DYNAMIC_API_TOKEN!,
  });

  const signature = await delegatedSignMessage(client, {
    walletId: rec.walletId,
    shareSetId: rec.shareSetId,
    walletApiKey: secrets.walletApiKey,
    keyShare: secrets.keyShare,
    message,
    onError: (err: Error) =>
      log.warn("delegated sign error", { err: String(err) }),
  });

  if (opts.amountUsd != null) recordSpend(walletId, opts.amountUsd);
  log.info("delegated message signed", {
    walletId,
    address: rec.address,
    amountUsd: opts.amountUsd,
  });

  return { signature, address: rec.address };
}

export { getDelegationRecord, getDelegationByAddress };
