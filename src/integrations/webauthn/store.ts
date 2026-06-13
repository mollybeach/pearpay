import type { VerifiedRegistrationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { getEnv } from "@/lib/env";

export interface StoredCredential {
  credentialID: string;
  credentialPublicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

const STORE_PATH = path.join(process.cwd(), ".webauthn-store.json");
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

interface StoredChallenge {
  challenge: string;
  expiresAt: number;
}

interface WebAuthnStore {
  credentials: Record<string, StoredCredential[]>;
  challenges: Record<string, StoredChallenge>;
}

type SerializedCredential = Omit<StoredCredential, "credentialPublicKey"> & {
  credentialPublicKey: number[];
};

function storePath(): string {
  return getEnv().WEBAUTHN_STORE_PATH ?? STORE_PATH;
}

function serializeCredentials(
  store: Record<string, StoredCredential[]>,
): Record<string, SerializedCredential[]> {
  return Object.fromEntries(
    Object.entries(store).map(([userId, creds]) => [
      userId,
      creds.map((c) => ({
        ...c,
        credentialPublicKey: Array.from(c.credentialPublicKey),
      })),
    ]),
  );
}

function deserializeCredentials(
  store: Record<string, SerializedCredential[]>,
): Record<string, StoredCredential[]> {
  return Object.fromEntries(
    Object.entries(store).map(([userId, creds]) => [
      userId,
      creds.map((c) => ({
        ...c,
        credentialPublicKey: new Uint8Array(c.credentialPublicKey),
      })),
    ]),
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asSerializedCredentials(
  value: unknown,
): Record<string, SerializedCredential[]> {
  if (!isObject(value)) return {};
  return value as Record<string, SerializedCredential[]>;
}

function asChallenges(value: unknown): Record<string, StoredChallenge> {
  if (!isObject(value)) return {};
  return value as Record<string, StoredChallenge>;
}

function loadStore(): WebAuthnStore {
  const file = storePath();
  if (!existsSync(file)) return { credentials: {}, challenges: {} };
  try {
    const raw = readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (isObject(parsed) && ("credentials" in parsed || "challenges" in parsed)) {
      return {
        credentials: deserializeCredentials(
          asSerializedCredentials(parsed.credentials),
        ),
        challenges: asChallenges(parsed.challenges),
      };
    }
    return {
      credentials: deserializeCredentials(asSerializedCredentials(parsed)),
      challenges: {},
    };
  } catch {
    return { credentials: {}, challenges: {} };
  }
}

function saveStore(store: WebAuthnStore) {
  writeFileSync(
    storePath(),
    JSON.stringify(
      {
        credentials: serializeCredentials(store.credentials),
        challenges: store.challenges,
      },
      null,
      2,
    ),
  );
}

let memoryStore: WebAuthnStore = loadStore();

export function getUserCredentials(userId: string): StoredCredential[] {
  return memoryStore.credentials[userId] ?? [];
}

export function saveCredential(
  userId: string,
  registration: VerifiedRegistrationResponse,
) {
  if (!registration.registrationInfo) return;

  const { credential } = registration.registrationInfo;

  const entry: StoredCredential = {
    credentialID: Buffer.from(credential.id).toString("base64url"),
    credentialPublicKey: new Uint8Array(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports,
  };

  const existing = memoryStore.credentials[userId] ?? [];
  memoryStore.credentials[userId] = [
    ...existing.filter((cred) => cred.credentialID !== entry.credentialID),
    entry,
  ];
  saveStore(memoryStore);
}

export function findCredential(
  userId: string,
  credentialId: string,
): StoredCredential | undefined {
  return getUserCredentials(userId).find((c) => c.credentialID === credentialId);
}

export function updateCredentialCounter(
  userId: string,
  credentialId: string,
  counter: number,
) {
  const creds = getUserCredentials(userId);
  memoryStore.credentials[userId] = creds.map((c) =>
    c.credentialID === credentialId ? { ...c, counter } : c,
  );
  saveStore(memoryStore);
}

export function saveChallenge(
  userId: string,
  purpose: "registration" | "authentication",
  challenge: string,
  now = Date.now(),
): void {
  memoryStore.challenges[`${purpose}:${userId}`] = {
    challenge,
    expiresAt: now + CHALLENGE_TTL_MS,
  };
  saveStore(memoryStore);
}

export function consumeChallenge(
  userId: string,
  purpose: "registration" | "authentication",
  challenge: string,
  now = Date.now(),
): boolean {
  const key = `${purpose}:${userId}`;
  const record = memoryStore.challenges[key];
  delete memoryStore.challenges[key];
  saveStore(memoryStore);
  return Boolean(record && record.challenge === challenge && record.expiresAt > now);
}

export function resetWebAuthnStoreForTests(): void {
  memoryStore = { credentials: {}, challenges: {} };
}
