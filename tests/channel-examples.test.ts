import { describe, expect, it } from "vitest";
import { parseIntent } from "@/core/nlp";
import { parsePayment } from "@/lib/imessage";

/**
 * The five canonical channel examples from the README must parse correctly
 * through the production NLP parser (used by the orchestrator / /api/payments)
 * and, where they carry an amount, through the playground parser too.
 */

describe("channel example messages — production parser (parseIntent)", () => {
  it("Telegram: “Send Molly $20”", () => {
    const i = parseIntent("Send Molly $20");
    expect(i.type).toBe("send");
    expect(i.amount).toBe(20_000_000n);
    expect(i.recipients[0]?.raw).toBe("Molly");
    expect(i.recipients[0]?.hint).toBe("name");
  });

  it("Discord: “/pay @molly 20”", () => {
    const i = parseIntent("/pay @molly 20");
    expect(i.type).toBe("send");
    expect(i.amount).toBe(20_000_000n);
    expect(i.recipients[0]?.raw).toBe("@molly");
    expect(i.recipients[0]?.hint).toBe("handle");
  });

  it("WhatsApp: “Pay Alex back for dinner” (no amount → memo only)", () => {
    const i = parseIntent("Pay Alex back for dinner");
    expect(i.type).toBe("send");
    expect(i.amount).toBeUndefined();
    expect(i.memo).toBe("dinner");
    expect(i.recipients[0]?.raw).toBe("Alex");
  });

  it("Slack: “Split lunch with the engineering team” (split, group recipient)", () => {
    const i = parseIntent("Split lunch with the engineering team");
    expect(i.type).toBe("split");
    expect(i.recipients.some((r) => /engineering team/i.test(r.raw))).toBe(true);
  });

  it("X DM: “Send 50 USDC to @molly”", () => {
    const i = parseIntent("Send 50 USDC to @molly");
    expect(i.type).toBe("send");
    expect(i.amount).toBe(50_000_000n);
    expect(i.recipients[0]?.raw).toBe("@molly");
    expect(i.recipients[0]?.hint).toBe("handle");
  });
});

describe("channel example messages — playground parser (parsePayment)", () => {
  it("settles the amount-bearing examples", () => {
    expect(parsePayment("Send Molly $20", "Molly")).toMatchObject({
      amount: 20,
      token: "USD",
      outcome: "settled",
    });
    expect(parsePayment("/pay @molly 20", "molly")).toMatchObject({
      amount: 20,
      recipientName: "molly",
      outcome: "settled",
    });
    expect(parsePayment("Send 50 USDC to @molly", "molly")).toMatchObject({
      amount: 50,
      token: "USDC",
      outcome: "settled",
    });
  });

  it("returns null for the no-amount examples (handled by the channel UI)", () => {
    // WhatsApp asks for the amount; Slack runs a split flow.
    expect(parsePayment("Pay Alex back for dinner")).toBeNull();
    expect(parsePayment("Split lunch with the engineering team")).toBeNull();
  });
});
