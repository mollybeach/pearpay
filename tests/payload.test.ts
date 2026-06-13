import { describe, expect, it } from "vitest";
import {
  decodePayload,
  encodePayload,
  formatRecipient,
  type PaymentPayload,
} from "@/lib/payload";

describe("payload codec", () => {
  const sample: PaymentPayload = {
    amount: 45,
    token: "USDC",
    recipient: "0x1234567890123456789012345678901234567890",
    intent_id: "pay_test-intent",
    recipient_label: "Security Agent",
  };

  it("round-trips encode and decode", () => {
    const encoded = encodePayload(sample);
    const decoded = decodePayload(encoded);
    expect(decoded.amount).toBe(45);
    expect(decoded.recipient).toBe(sample.recipient);
    expect(decoded.intent_id).toBe(sample.intent_id);
    expect(decoded.recipient_label).toBe("Security Agent");
  });

  it("formats recipient label when present", () => {
    expect(formatRecipient(sample)).toBe("Security Agent");
  });

  it("truncates address when label absent", () => {
    const noLabel = { ...sample, recipient_label: undefined };
    expect(formatRecipient(noLabel)).toMatch(/0x1234/);
  });
});
