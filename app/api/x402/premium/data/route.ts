import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const payment = request.headers.get("x-payment");
  if (!payment) {
    return NextResponse.json(
      { detail: "Payment Required" },
      {
        status: 402,
        headers: { "X-Payment-Required": "x402" },
      },
    );
  }

  return NextResponse.json({
    dataset: "premium_agent_intelligence",
    tokens: 1024,
  });
}
