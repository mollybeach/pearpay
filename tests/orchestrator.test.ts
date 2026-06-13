import { beforeEach, describe, expect, it, vi } from "vitest";
import { processIntent, processMessage } from "@/core/payments";
import { serializePaymentResult } from "@/core/payments/serialize";
import type { PaymentIntent } from "@/core/nlp/types";

vi.mock("@/integrations/dynamic", () => ({
  lookupPearPayUser: vi.fn(async (identifier: string) => {
    const users: Record<string, { userId: string; address: `0x${string}`; ens?: string }> = {
      "molly.eth": {
        userId: "usr_molly",
        address: "0x2222222222222222222222222222222222222222",
        ens: "molly.eth",
      },
      "@alice": {
        userId: "usr_alice",
        address: "0x3333333333333333333333333333333333333333",
      },
      "@bob": {
        userId: "usr_bob",
        address: "0x4444444444444444444444444444444444444444",
      },
    };
    return users[identifier] ?? null;
  }),
  createEmbeddedWallet: vi.fn(async () => ({
    walletId: "wallet_claimant",
    address: "0x5555555555555555555555555555555555555555",
    kind: "embedded",
  })),
}));

vi.mock("@/integrations/ens", () => ({
  resolveEns: vi.fn(async () => null),
}));

vi.mock("@/integrations/twilio", () => ({
  sendClaimLink: vi.fn(async () => ({ sid: "SM_test", delivered: true })),
}));

vi.mock("@/integrations/hedera", () => ({
  settleUsdcOnHedera: vi.fn(async () => ({
    transactionId: "0.0.1001@1718200000.000000000",
    status: "settled",
    network: "testnet",
  })),
  logToConsensus: vi.fn(async () => ({
    topicId: "0.0.2002",
    sequenceNumber: 1,
  })),
}));

vi.mock("@/integrations/unlink", () => ({
  privateTransfer: vi.fn(async () => ({
    noteId: "note_private",
    status: "shielded",
  })),
}));

const sender = {
  label: "Molly",
  address: "0x1111111111111111111111111111111111111111" as const,
  chainId: 1,
};

describe("payment orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("settles an instant send and serializes without bigint leaks", async () => {
    const result = await processMessage("Send molly.eth $12.50 for dinner", sender);
    expect(result.ok).toBe(true);
    expect(result.legs[0]?.outcome).toBe("instant");
    expect(result.legs[0]?.rail).toBe("arc");
    expect(result.legs[0]?.sourceChainId).toBe(1);
    expect(result.legs[0]?.destinationChainId).toBe(5042002);
    expect(result.legs[0]?.tokenAddress).toBe(
      "0x3600000000000000000000000000000000000000",
    );
    expect(result.legs[0]?.route).toBe("source-to-arc");
    expect(result.legs[0]?.settlementRef).toMatch(/^local_/);

    const dto = serializePaymentResult(result);
    expect(dto.legs[0]?.amount).toEqual({
      usdc: "12.5",
      baseUnits: "12500000",
      display: "$12.5",
    });
    expect(dto.legs[0]?.rail).toBe("arc");
    expect(dto.legs[0]?.route).toBe("source-to-arc");
    expect(() => JSON.stringify(dto)).not.toThrow();
    expect(JSON.stringify(dto)).not.toContain("12500000n");
  });

  it("creates a claimable payment and sends a claim link", async () => {
    const result = await processMessage("Pay +12065550100 $8", sender, {
      channel: "sms",
    });
    expect(result.ok).toBe(true);
    expect(result.legs[0]?.outcome).toBe("claimable");
    expect(result.legs[0]?.rail).toBe("arc");
    expect(result.legs[0]?.route).toBe("source-to-arc");
    expect(result.legs[0]?.claimUrl).toContain("/claim/");
    expect(result.legs[0]?.notified).toBe(true);
  });

  it("splits an amount across recipients", async () => {
    const intent: PaymentIntent = {
      type: "split",
      recipients: [
        { raw: "@alice", hint: "handle" },
        { raw: "@bob", hint: "handle" },
      ],
      amount: 10_000_001n,
      private: false,
      confidence: 1,
      original: "Split $10.000001 with @alice and @bob",
    };
    const result = await processIntent(intent, sender, { channel: "discord" });
    expect(result.legs).toHaveLength(2);
    expect(result.legs.map((leg) => leg.amount.toString())).toEqual([
      "5000001",
      "5000000",
    ]);
  });

  it("routes private sends through the private rail", async () => {
    const result = await processMessage("Send molly.eth $2 privately", sender);
    expect(result.ok).toBe(true);
    expect(result.legs[0]?.rail).toBe("unlink");
    expect(result.legs[0]?.settlementRef).toBe("note_private");
  });

  it("returns structured failures for unknown or incomplete intents", async () => {
    await expect(processMessage("hello there", sender)).resolves.toMatchObject({
      ok: false,
      error: "unrecognized_intent",
    });
    await expect(processMessage("Send Molly", sender)).resolves.toMatchObject({
      ok: false,
      error: "missing_amount",
    });
  });
});
