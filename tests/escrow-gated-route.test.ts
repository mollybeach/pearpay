import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/lib/env";
import { GET } from "../app/api/x402/premium/escrow-gated/data/route";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost:3000/api/x402/premium/escrow-gated/data", {
    method: "GET",
    headers,
  });
}

describe("GET /api/x402/premium/escrow-gated/data", () => {
  const prevSeller = process.env.X402_SELLER_ADDRESS;

  beforeEach(() => resetEnvCache());
  afterEach(() => {
    if (prevSeller === undefined) delete process.env.X402_SELLER_ADDRESS;
    else process.env.X402_SELLER_ADDRESS = prevSeller;
    resetEnvCache();
  });

  it("issues a Gateway-aware 402 challenge when no payment is presented", async () => {
    process.env.X402_SELLER_ADDRESS =
      "0x73AD7346B01DAb0398aEd664758b671c20DBb869";
    resetEnvCache();

    const res = await GET(req());
    expect(res.status).toBe(402);
    // x402 v2 challenge header the Circle GatewayClient reads.
    expect(res.headers.get("PAYMENT-REQUIRED")).toBeTruthy();

    const body = await res.json();
    expect(body.x402Version).toBe(2);
    expect(Array.isArray(body.accepts)).toBe(true);
    expect(body.accepts[0].payTo).toBe(
      "0x73AD7346B01DAb0398aEd664758b671c20DBb869",
    );
    // sub-cent nanopayment: 0.001 USDC -> 1000 atomic units (6 decimals).
    expect(body.accepts[0].amount).toBe("1000");
  });

  it("falls back to a legacy 402 stub when no seller is configured", async () => {
    delete process.env.X402_SELLER_ADDRESS;
    resetEnvCache();

    const res = await GET(req());
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.accepts).toBe("x402");
  });
});
