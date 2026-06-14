import { describe, expect, it } from "vitest";
import { buildReplyText } from "@/channels/handler";
import type { PaymentResult, PaymentLeg } from "@/core/payments/types";
import type { ResolvedRecipient } from "@/core/recipients/types";

/**
 * The in-chat reply (Telegram/iMessage/etc.) must surface the actionable links
 * the demo depends on: the tappable payment card, a public Arc settlement proof
 * for transparent legs, and a NO-public-link notice for private (Unlink) legs.
 */

function recipient(label: string): ResolvedRecipient {
  return {
    label,
    address: "0xB214f8D70AB85F2628b8ba684D0C45a1a5bE4763",
    deliveryMode: "instant",
  } as unknown as ResolvedRecipient;
}

function result(legs: PaymentLeg[], extra: Partial<PaymentResult> = {}): PaymentResult {
  return { ok: true, summary: "Sent $0.01.", legs, ...extra };
}

describe("buildReplyText", () => {
  it("includes the tappable payment card link first", () => {
    const text = buildReplyText(
      result([], { payUrl: "https://pearpay.app/pay/ey123" }),
    );
    expect(text).toContain("Tap to open the payment card:");
    expect(text).toContain("https://pearpay.app/pay/ey123");
  });

  it("links a public Arc settlement proof for transparent legs", () => {
    const leg = {
      recipient: recipient("0xB214…4763"),
      amount: 10_000n,
      outcome: "instant",
      rail: "arc",
      txHash: "0xabc123",
      private: false,
    } as unknown as PaymentLeg;
    const text = buildReplyText(result([leg]));
    expect(text).toContain("Arc settlement proof:");
    expect(text).toContain("/tx/0xabc123");
  });

  it("never exposes a public link for a private (Unlink) leg", () => {
    const leg = {
      recipient: recipient("0xB214…4763"),
      amount: 10_000n,
      outcome: "instant",
      rail: "unlink",
      settlementRef: "note_abcdef0123456789",
      private: true,
    } as unknown as PaymentLeg;
    const text = buildReplyText(result([leg]));
    expect(text).toContain("Settled privately via the Unlink shielded pool");
    expect(text).not.toContain("/tx/");
    // The full note id is shortened, never dumped in full.
    expect(text).not.toContain("note_abcdef0123456789");
  });

  it("surfaces a claim link for claimable legs", () => {
    const leg = {
      recipient: recipient("@alex"),
      amount: 10_000n,
      outcome: "claimable",
      rail: "arc",
      claimUrl: "https://pearpay.app/claim/tok123",
      private: false,
    } as unknown as PaymentLeg;
    const text = buildReplyText(result([leg]));
    expect(text).toContain("Claim link for @alex:");
    expect(text).toContain("https://pearpay.app/claim/tok123");
  });
});
