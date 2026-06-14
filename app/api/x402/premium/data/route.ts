import { NextResponse } from "next/server";
import { verifyX402Payment } from "@/lib/x402";
import {
  build402Body,
  buildPaymentRequirements,
  decodePaymentHeader,
  encodePaymentRequired,
  encodePaymentResponse,
  isGatewaySellerConfigured,
  sellerAddress,
  verifyAndSettle,
} from "@/integrations/arc/x402-gateway";

export const runtime = "nodejs";

const PRICE_USD = "0.001"; // sub-cent nanopayment
const DATASET = {
  dataset: "premium_agent_intelligence",
  tokens: 1024,
};

export async function GET(request: Request) {
  // x402 standard request header is `X-PAYMENT`; Circle's sample also accepts
  // `payment-signature`. Read either.
  const header =
    request.headers.get("x-payment") ?? request.headers.get("payment-signature");

  const gatewayOn = isGatewaySellerConfigured();
  const payTo = sellerAddress();

  // ── No payment yet -> HTTP 402 advertising how to pay ──────────────────────
  if (!header) {
    if (gatewayOn && payTo) {
      const requirements = buildPaymentRequirements({
        priceUsd: PRICE_USD,
        payTo,
      });
      const body = build402Body(requirements, {
        url: request.url,
        description: "PearPay premium agent intelligence dataset",
      });
      const paymentRequired = encodePaymentRequired(body);
      return NextResponse.json(body, {
        status: 402,
        headers: {
          // Circle GatewayClient reads `PAYMENT-REQUIRED` (x402 v2).
          "PAYMENT-REQUIRED": paymentRequired,
          "X-Payment-Required": paymentRequired,
        },
      });
    }
    // Legacy stub 402 (no Circle Gateway configured).
    return NextResponse.json(
      {
        detail: "Payment Required",
        accepts: "x402",
        price: PRICE_USD,
        currency: "USDC",
      },
      { status: 402, headers: { "X-Payment-Required": "x402" } },
    );
  }

  // ── Real Circle Gateway path: verify + settle (gas-free batched) ───────────
  if (gatewayOn && payTo) {
    const payload = decodePaymentHeader(header);
    if (payload) {
      try {
        const requirements = buildPaymentRequirements({
          priceUsd: PRICE_USD,
          payTo,
        });
        const { verify, settle } = await verifyAndSettle(payload, requirements);
        if (!verify.isValid) {
          return NextResponse.json(
            { detail: "Invalid payment", reason: verify.invalidReason },
            { status: 402 },
          );
        }
        if (!settle?.success) {
          return NextResponse.json(
            { detail: "Settlement failed", reason: settle?.errorReason },
            { status: 402 },
          );
        }
        return NextResponse.json(
          {
            ...DATASET,
            paid_with: "circle-gateway-x402-batched",
            settlement_tx: settle.transaction,
            network: settle.network,
            payer: settle.payer,
          },
          { headers: { "X-Payment-Response": encodePaymentResponse(settle) } },
        );
      } catch {
        // Fall through to legacy verification on SDK/transport error.
      }
    }
  }

  // ── Legacy EIP-191 fallback (keeps the no-Circle demo working) ─────────────
  const valid = await verifyX402Payment(header);
  if (!valid) {
    return NextResponse.json(
      { detail: "Invalid or unsigned payment" },
      { status: 402 },
    );
  }
  return NextResponse.json({ ...DATASET, paid_with: "dynamic-server-wallet" });
}
