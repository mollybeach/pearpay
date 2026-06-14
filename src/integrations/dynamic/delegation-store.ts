import crypto from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { ServerKeyShare } from "@dynamic-labs-wallet/node";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.scoped("dynamic:delegation-store");

/**
 * Persistent, encrypted-at-rest store for delegated-access materials.
 *
 * After a user approves delegation, Dynamic sends the (RSA-encrypted) MPC
 * server key share and a per-wallet API key to our webhook. We RSA-decrypt
 * them once, then re-seal with AES-256-GCM before touching disk so the raw
 * signing material never sits in plaintext. In production this should be a KMS
 * / envelope-encrypted DB; the disk store keeps the hackathon demo stateless
 * across Next.js server restarts.
 */

export interface SpendAuthorization {
  /** Max cumulative USD this delegation may spend before re-authentication. */
  maxAmountUsd: number;
  /** Epoch ms after which the delegation must not be used. */
  expiresAt: number;
  /** Running total of USD already spent under this delegation. */
  spentUsd: number;
}

interface SealedBlob {
  iv: string;
  ct: string;
  tag: string;
}

export interface DelegationSecrets {
  walletApiKey: string;
  keyShare: ServerKeyShare;
}

export interface DelegationRecord {
  walletId: string;
  /** WaasWallets.id from the webhook — passed to delegatedSignMessage. */
  shareSetId?: string;
  userId?: string;
  address: `0x${string}`;
  chainName: string;
  sealed: SealedBlob;
  authorization?: SpendAuthorization;
  createdAt: number;
  revokedAt?: number;
}

interface StoreShape {
  byWalletId: Record<string, DelegationRecord>;
}

function storePath(): string {
  const env = getEnv();
  return (
    env.DELEGATION_STORE_PATH ||
    path.join(process.cwd(), ".delegation-store.json")
  );
}

function encryptionKey(): Buffer {
  const env = getEnv();
  const raw = env.DELEGATION_ENCRYPTION_KEY?.trim();
  if (raw && /^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  // Treat any other provided value as a passphrase; otherwise derive a stable
  // local key from the wallet password / API token so dev restarts can still
  // unseal what they sealed.
  const seed =
    raw ||
    env.DYNAMIC_WALLET_PASSWORD ||
    env.DYNAMIC_API_TOKEN ||
    "pearpay-local-dev";
  return crypto.scryptSync(seed, "pearpay:delegation:v1", 32);
}

export function seal(secrets: DelegationSecrets): SealedBlob {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const pt = Buffer.from(JSON.stringify(secrets), "utf8");
  const ct = Buffer.concat([cipher.update(pt), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ct: ct.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function unseal(blob: SealedBlob): DelegationSecrets {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(blob.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(blob.ct, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(pt.toString("utf8")) as DelegationSecrets;
}

function load(): StoreShape {
  try {
    if (!existsSync(storePath())) return { byWalletId: {} };
    return JSON.parse(readFileSync(storePath(), "utf8")) as StoreShape;
  } catch (err) {
    log.warn("delegation store read failed", { err: String(err) });
    return { byWalletId: {} };
  }
}

function persist(store: StoreShape): void {
  writeFileSync(storePath(), JSON.stringify(store, null, 2));
}

export function saveDelegation(record: DelegationRecord): void {
  const store = load();
  store.byWalletId[record.walletId] = record;
  persist(store);
}

export function getDelegationRecord(walletId: string): DelegationRecord | null {
  return load().byWalletId[walletId] ?? null;
}

export function getDelegationByAddress(
  address: string,
): DelegationRecord | null {
  const lower = address.toLowerCase();
  return (
    Object.values(load().byWalletId).find(
      (r) => r.address.toLowerCase() === lower && !r.revokedAt,
    ) ?? null
  );
}

/**
 * Most-recently delegated, non-revoked wallet. Lets the autonomous agent act
 * on the user's behalf without the caller having to know the walletId — the
 * common case right after a single FaceID approval during onboarding.
 */
export function getActiveDelegation(): DelegationRecord | null {
  const active = Object.values(load().byWalletId).filter((r) => !r.revokedAt);
  if (active.length === 0) return null;
  return active.sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

export function markRevoked(walletId: string): void {
  const store = load();
  const rec = store.byWalletId[walletId];
  if (rec) {
    rec.revokedAt = Date.now();
    persist(store);
  }
}

export function recordSpend(walletId: string, amountUsd: number): void {
  const store = load();
  const rec = store.byWalletId[walletId];
  if (rec?.authorization) {
    rec.authorization.spentUsd += amountUsd;
    persist(store);
  }
}
