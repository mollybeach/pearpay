import type { VerifiedRegistrationResponse } from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export interface StoredCredential {
  credentialID: string;
  credentialPublicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
}

const STORE_PATH = path.join(process.cwd(), ".webauthn-store.json");

function loadStore(): Record<string, StoredCredential[]> {
  if (!existsSync(STORE_PATH)) return {};
  try {
    const raw = readFileSync(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Record<
      string,
      Array<
        Omit<StoredCredential, "credentialPublicKey"> & {
          credentialPublicKey: number[];
        }
      >
    >;
    return Object.fromEntries(
      Object.entries(parsed).map(([userId, creds]) => [
        userId,
        creds.map((c) => ({
          ...c,
          credentialPublicKey: new Uint8Array(c.credentialPublicKey),
        })),
      ]),
    );
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, StoredCredential[]>) {
  const serializable = Object.fromEntries(
    Object.entries(store).map(([userId, creds]) => [
      userId,
      creds.map((c) => ({
        ...c,
        credentialPublicKey: Array.from(c.credentialPublicKey),
      })),
    ]),
  );
  writeFileSync(STORE_PATH, JSON.stringify(serializable, null, 2));
}

let memoryStore: Record<string, StoredCredential[]> = loadStore();

export function getUserCredentials(userId: string): StoredCredential[] {
  return memoryStore[userId] ?? [];
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

  const existing = memoryStore[userId] ?? [];
  memoryStore[userId] = [...existing, entry];
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
  memoryStore[userId] = creds.map((c) =>
    c.credentialID === credentialId ? { ...c, counter } : c,
  );
  saveStore(memoryStore);
}
