import { describe, expect, it } from "vitest";
import {
  ARC_NETWORK_ID,
  DEFAULT_GATEWAY_WALLET,
  GATEWAY_BATCHING_NAME,
  GATEWAY_BATCHING_VERSION,
  X402_VERSION,
  encodePaymentRequired,
  build402Body,
  buildPaymentRequirements,
  decodePaymentHeader,
  encodePaymentResponse,
  usdcAtomic,
} from "@/integrations/arc/x402-gateway";

const PAY_TO = "0x1111111111111111111111111111111111111111";

describe("x402 gateway — pure helpers", () => {
  it("converts USD to atomic USDC (6 decimals) with safe rounding", () => {
    expect(usdcAtomic("0.001")).toBe("1000");
    expect(usdcAtomic(1)).toBe("1000000");
    expect(usdcAtomic("45.00")).toBe("45000000");
    // floating point that would corrupt without rounding
    expect(usdcAtomic(0.07)).toBe("70000");
  });

  it("rejects invalid prices", () => {
    expect(() => usdcAtomic("abc")).toThrow();
    expect(() => usdcAtomic(-1)).toThrow();
  });

  it("builds Arc-testnet PaymentRequirements in the verified shape", () => {
    const reqs = buildPaymentRequirements({ priceUsd: "0.001", payTo: PAY_TO });
    expect(reqs.scheme).toBe("exact");
    expect(reqs.network).toBe(ARC_NETWORK_ID);
    expect(reqs.network).toBe("eip155:5042002");
    expect(reqs.amount).toBe("1000");
    expect(reqs.payTo).toBe(PAY_TO);
    expect(reqs.maxTimeoutSeconds).toBe(60);
    expect(reqs.extra).toMatchObject({
      name: GATEWAY_BATCHING_NAME,
      version: GATEWAY_BATCHING_VERSION,
      verifyingContract: DEFAULT_GATEWAY_WALLET,
    });
  });

  it("builds a standard x402 402 body advertising accepts[]", () => {
    const reqs = buildPaymentRequirements({ priceUsd: "0.001", payTo: PAY_TO });
    const body = build402Body(reqs, {
      url: "https://pearpay.app/api/x402/premium/data",
      description: "premium",
    });
    expect(body.x402Version).toBe(X402_VERSION);
    expect(body.x402Version).toBe(2);
    expect(body.accepts).toHaveLength(1);
    expect(body.accepts[0]).toBe(reqs);
    expect(body.resource.mimeType).toBe("application/json");
  });

  it("round-trips a base64 payment payload header", () => {
    const payload = { x402Version: 2, payload: { signature: "0xdead" } };
    const header = Buffer.from(JSON.stringify(payload), "utf8").toString(
      "base64",
    );
    const decoded = decodePaymentHeader(header);
    expect(decoded?.x402Version).toBe(2);
    expect(decoded?.payload).toMatchObject({ signature: "0xdead" });
  });

  it("rejects malformed or non-x402 headers", () => {
    expect(decodePaymentHeader("not-base64-json!!")).toBeNull();
    const noVersion = Buffer.from(JSON.stringify({ payload: {} })).toString(
      "base64",
    );
    expect(decodePaymentHeader(noVersion)).toBeNull();
  });

  it("encodes a 402 body for the PAYMENT-REQUIRED header", () => {
    const reqs = buildPaymentRequirements({ priceUsd: "0.001", payTo: PAY_TO });
    const body = build402Body(reqs, {
      url: "https://pearpay.app/api/x402/premium/data",
      description: "premium",
    });
    const encoded = encodePaymentRequired(body);
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    expect(decoded.accepts[0].extra?.name).toBe(GATEWAY_BATCHING_NAME);
  });

  it("encodes a settle response for the X-Payment-Response header", () => {
    const encoded = encodePaymentResponse({
      success: true,
      transaction: "0xabc",
      network: ARC_NETWORK_ID,
      payer: PAY_TO,
    });
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    expect(decoded.success).toBe(true);
    expect(decoded.transaction).toBe("0xabc");
  });
});
