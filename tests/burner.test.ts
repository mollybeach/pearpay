import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import {
  createEphemeralBurner,
  disposeBurner,
} from "@/integrations/unlink/burner";

describe("unlink ephemeral burner", () => {
  it("mints a valid, checksummed EOA whose key derives its address", () => {
    const b = createEphemeralBurner();
    expect(b.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(b.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    expect(b.disposed).toBe(false);
    // The address must be the real derivation of the private key.
    expect(privateKeyToAccount(b.privateKey).address).toBe(b.address);
  });

  it("mints a fresh, distinct identity each call (single-use)", () => {
    const a = createEphemeralBurner();
    const b = createEphemeralBurner();
    expect(a.address).not.toBe(b.address);
    expect(a.privateKey).not.toBe(b.privateKey);
  });

  it("disposes by flagging and wiping the key reference", () => {
    const b = createEphemeralBurner();
    disposeBurner(b);
    expect(b.disposed).toBe(true);
    expect(b.privateKey).toBe(`0x${"0".repeat(64)}`);
  });
});
