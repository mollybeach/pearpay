import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/lib/env";
import {
  type DelegationRecord,
  getActiveDelegation,
  markRevoked,
  saveDelegation,
  seal,
  unseal,
} from "@/integrations/dynamic/delegation-store";

// A ServerKeyShare is an opaque blob to the store; cast a stub for the test.
const stubSecrets = {
  walletApiKey: "wak_test",
  keyShare: { share: "deadbeef" } as never,
};

function record(walletId: string, createdAt: number): DelegationRecord {
  return {
    walletId,
    shareSetId: `share_${walletId}`,
    address: "0x1111111111111111111111111111111111111111",
    chainName: "EVM",
    sealed: seal(stubSecrets),
    createdAt,
  };
}

describe("delegation store", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "pearpay-deleg-"));
    process.env.DELEGATION_STORE_PATH = path.join(dir, "store.json");
    process.env.DELEGATION_ENCRYPTION_KEY = "a".repeat(64);
    resetEnvCache();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    delete process.env.DELEGATION_STORE_PATH;
    delete process.env.DELEGATION_ENCRYPTION_KEY;
    resetEnvCache();
  });

  it("seals and unseals secrets symmetrically", () => {
    const sealed = seal(stubSecrets);
    expect(sealed.ct).not.toContain("wak_test");
    expect(unseal(sealed)).toEqual(stubSecrets);
  });

  it("returns the most recently delegated non-revoked wallet", () => {
    saveDelegation(record("wallet-old", 1_000));
    saveDelegation(record("wallet-new", 2_000));
    expect(getActiveDelegation()?.walletId).toBe("wallet-new");
  });

  it("skips revoked delegations", () => {
    saveDelegation(record("wallet-old", 1_000));
    saveDelegation(record("wallet-new", 2_000));
    markRevoked("wallet-new");
    expect(getActiveDelegation()?.walletId).toBe("wallet-old");
  });

  it("returns null when no active delegation exists", () => {
    expect(getActiveDelegation()).toBeNull();
  });
});
