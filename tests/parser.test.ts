import { describe, expect, it } from "vitest";
import { parseIntent } from "@/core/nlp";

describe("parseIntent", () => {
  it("parses a simple send with an amount and recipient", () => {
    const intent = parseIntent("Send Molly $20");
    expect(intent.type).toBe("send");
    expect(intent.amount).toBe(20_000_000n);
    expect(intent.recipients[0]?.raw).toBe("Molly");
    expect(intent.recipients[0]?.hint).toBe("name");
  });

  it("detects raw 0x address recipients", () => {
    const intent = parseIntent(
      "Send 50 USDC to 0x4E2B5C9a1f0e3D2c8b7A6F5e4D3c2B1a09f8E7d6",
    );
    expect(intent.recipients[0]?.raw).toBe(
      "0x4E2B5C9a1f0e3D2c8b7A6F5e4D3c2B1a09f8E7d6",
    );
    expect(intent.recipients[0]?.hint).toBe("address");
    expect(intent.amount).toBe(50_000_000n);
  });

  it("detects private transfers and memos", () => {
    const intent = parseIntent("Pay Alex $15 privately for dinner");
    expect(intent.type).toBe("send");
    expect(intent.private).toBe(true);
    expect(intent.memo).toBe("dinner");
  });

  it("classifies split intents", () => {
    const intent = parseIntent("Split lunch with the engineering team");
    expect(intent.type).toBe("split");
  });

  it("parses spelled-out amounts", () => {
    const intent = parseIntent("Send Alex twenty dollars");
    expect(intent.amount).toBe(20_000_000n);
  });

  it("detects phone-number recipients", () => {
    const intent = parseIntent("Send $25 to +1 (206) 947-6991");
    expect(intent.recipients[0]?.hint).toBe("phone");
  });

  it("reports low confidence for unrecognized messages", () => {
    const intent = parseIntent("hello there");
    expect(intent.type).toBe("unknown");
    expect(intent.confidence).toBeLessThan(0.5);
  });
});
