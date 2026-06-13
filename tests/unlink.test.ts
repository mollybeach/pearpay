import { afterEach, describe, expect, it } from "vitest";
import {
  deposit,
  privateTransfer,
  withdraw,
  resetUnlinkClient,
} from "@/integrations/unlink";
import { selectRail, settleOnRail } from "@/core/payments/settlement";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc";
import { parseUsdc } from "@/lib/money";

const FROM = `0x${"1".repeat(40)}` as `0x${string}`;
const TO = `0x${"2".repeat(40)}` as `0x${string}`;

afterEach(() => resetUnlinkClient());

/**
 * Unlink runs in deterministic stub mode here (no UNLINK_API_KEY in the test
 * env), so these exercise the private-rail wiring and primitive contracts
 * without the SDK or network. The real SDK path activates when the key, engine
 * URL, and account mnemonic are all set.
 */
describe("unlink private primitives (stub mode)", () => {
  it("deposit() returns a shielded note handle", async () => {
    const r = await deposit(FROM, parseUsdc(20), ARC_TESTNET_CHAIN_ID);
    expect(r.noteId).toMatch(/^note_/);
  });

  it("privateTransfer() shields amount + counterparty behind a note id", async () => {
    const r = await privateTransfer({
      fromAddress: FROM,
      toAddress: TO,
      amount: parseUsdc(50),
      chainId: ARC_TESTNET_CHAIN_ID,
    });
    expect(r.status).toBe("shielded");
    expect(r.noteId).toMatch(/^note_/);
    // The handle leaks neither the amount nor the full addresses.
    expect(r.noteId).not.toContain("50");
    expect(r.noteId).not.toContain(TO);
  });

  it("withdraw() returns an exit tx handle", async () => {
    const r = await withdraw(TO, parseUsdc(10), ARC_TESTNET_CHAIN_ID);
    expect(r.txId).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe("private settlement rail", () => {
  it("routes private payments to the unlink rail", () => {
    expect(selectRail({ amount: parseUsdc(20), isPrivate: true })).toBe(
      "unlink",
    );
    expect(selectRail({ amount: parseUsdc(20), isPrivate: false })).toBe("arc");
  });

  it("settleOnRail('unlink') settles privately with a note ref", async () => {
    const s = await settleOnRail("unlink", {
      fromAddress: FROM,
      toAddress: TO,
      amount: parseUsdc(20),
      chainId: ARC_TESTNET_CHAIN_ID,
    });
    expect(s.rail).toBe("unlink");
    expect(s.status).toBe("shielded");
    expect(s.ref).toMatch(/^note_/);
  });
});
