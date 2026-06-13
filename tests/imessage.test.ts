import { describe, expect, it } from "vitest";
import { formatAmount, parsePayment } from "@/lib/imessage";

describe("parsePayment", () => {
  it("parses a basic dollar send to a known contact", () => {
    const pay = parsePayment("Send Molly $20");
    expect(pay).not.toBeNull();
    expect(pay).toMatchObject({
      amount: 20,
      token: "USD",
      recipientName: "Molly",
      recipientLabel: "molly.eth",
      outcome: "settled",
    });
  });

  it("parses USDC and an ENS recipient after 'to'", () => {
    const pay = parsePayment("Send 50 USDC to molly.eth");
    expect(pay).toMatchObject({
      amount: 50,
      token: "USDC",
      recipientLabel: "molly.eth",
      outcome: "settled",
    });
  });

  it("flags private transfers regardless of recipient", () => {
    expect(parsePayment("Pay alex.eth 50 USDC privately")).toMatchObject({
      token: "USDC",
      recipientLabel: "alex.eth",
      outcome: "private",
    });
    // private wins even when the recipient is a known/instant user
    expect(parsePayment("Send Molly 50 USDC privately")?.outcome).toBe("private");
  });

  it("treats unknown recipients as claimable (escrow)", () => {
    expect(parsePayment("Send Alex $50")).toMatchObject({
      amount: 50,
      recipientName: "Alex",
      outcome: "claimable",
    });
  });

  it("resolves *.eth and known names to instant settlement", () => {
    expect(parsePayment("transfer 100 to sarah")).toMatchObject({
      amount: 100,
      recipientLabel: "sarah.eth",
      outcome: "settled",
    });
  });

  it("ignores pronoun recipients and falls back to the contact", () => {
    expect(parsePayment("send me $20")?.recipientName).toBe("Molly");
  });

  it("handles comma-grouped and decimal amounts", () => {
    expect(parsePayment("Send Molly $1,000")?.amount).toBe(1000);
    expect(parsePayment("Send Molly $12.50")?.amount).toBe(12.5);
    // caps to two decimal places
    expect(parsePayment("Send Molly $12.999")?.amount).toBe(12.99);
  });

  it("accepts a bare '$amount to name' with no verb", () => {
    expect(parsePayment("$25 to Bob")).toMatchObject({
      amount: 25,
      outcome: "claimable",
    });
  });

  it("parses a phone-number recipient as claimable", () => {
    const pay = parsePayment("Send $25 to +1 (206) 947-6991 for dinner");
    expect(pay?.amount).toBe(25);
    expect(pay?.outcome).toBe("claimable");
  });

  it("is case-insensitive", () => {
    expect(parsePayment("SEND MOLLY $20")?.outcome).toBe("settled");
  });

  describe("per-channel default recipient", () => {
    it("treats the named chat partner as an instant/known user", () => {
      // Telegram bot chat with Sasha
      expect(parsePayment("Send Sasha $20", "Sasha")?.outcome).toBe("settled");
      // unrelated name on that channel is still claimable
      expect(parsePayment("Send Jordan $40", "Sasha")).toMatchObject({
        recipientName: "Jordan",
        outcome: "claimable",
      });
    });

    it("falls back to the channel default when no recipient is named", () => {
      expect(parsePayment("send $15", "Sasha")?.recipientName).toBe("Sasha");
    });

    it("parses @-mentions and slash commands (Discord)", () => {
      expect(parsePayment("/pay maya 25", "Maya")).toMatchObject({
        amount: 25,
        recipientName: "maya",
        outcome: "settled",
      });
      expect(parsePayment("/tip @newuser 5", "Maya")).toMatchObject({
        amount: 5,
        recipientName: "newuser",
        outcome: "claimable",
      });
      expect(parsePayment("/pay dev.eth 100 USDC", "Maya")).toMatchObject({
        amount: 100,
        token: "USDC",
        recipientLabel: "dev.eth",
        outcome: "settled",
      });
    });
  });

  describe("non-payments return null", () => {
    it.each([
      ["empty string", ""],
      ["whitespace only", "   "],
      ["plain chat with no amount", "hey what's up"],
      ["intent but no amount", "Send Molly some money"],
      ["a number but no intent", "lunch was 20 bucks"],
      ["zero amount", "Send Molly $0"],
    ])("%s", (_label, input) => {
      expect(parsePayment(input)).toBeNull();
    });
  });
});

describe("formatAmount", () => {
  it("formats USD with two decimals", () => {
    expect(formatAmount({ amount: 20, token: "USD" })).toBe("$20.00");
    expect(formatAmount({ amount: 12.5, token: "USD" })).toBe("$12.50");
  });

  it("formats USDC with the ticker", () => {
    expect(formatAmount({ amount: 50, token: "USDC" })).toBe("50 USDC");
  });
});
