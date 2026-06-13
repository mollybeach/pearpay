import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";

const bodySchema = z.object({
  url: z.string().url(),
  amount: z.number().positive().default(0.001),
});

export async function POST(request: Request) {
  const env = getEnv();
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!env.FUNDER_PRIVATE_KEY) {
    return NextResponse.json(
      {
        detail:
          "x402 not configured. Set FUNDER_PRIVATE_KEY and deploy Gateway deposit.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    status: "authorized",
    url: parsed.data.url,
    amount: parsed.data.amount,
    mode: "stub",
    message: "Wire GatewayClient from @circle-fin/x402-batching",
  });
}
