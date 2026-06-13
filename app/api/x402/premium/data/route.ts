import { NextResponse } from "next/server";
import { verifyX402Payment } from "@/lib/x402";

export async function GET(request: Request) {
  const payment = request.headers.get("x-payment");
  if (!payment) {
    return NextResponse.json(
      {
        detail: "Payment Required",
        accepts: "x402",
        price: "0.001",
        currency: "USDC",
      },
      {
        status: 402,
        headers: { "X-Payment-Required": "x402" },
      },
    );
  }

  const valid = await verifyX402Payment(payment);
  if (!valid) {
    return NextResponse.json(
      { detail: "Invalid or unsigned payment" },
      { status: 402 },
    );
  }

  return NextResponse.json({
    dataset: "premium_agent_intelligence",
    tokens: 1024,
    paid_with: "dynamic-server-wallet",
  });
}
