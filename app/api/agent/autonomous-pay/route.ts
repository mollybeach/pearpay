import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getAgentService } from "@/core/agents/wallet";
import {
  agentGatewayPay,
  isGatewayBuyerConfigured,
} from "@/integrations/arc/x402-gateway";

const bodySchema = z.object({
  url: z.string().url().default("http://localhost:3000/api/x402/premium/data"),
  deposit_usd: z.string().optional(),
});

export async function POST(request: Request) {
  const agent = getAgentService();
  const env = getEnv();
  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ?? env.APP_URL
  ).replace(/\/$/, "");

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Preferred path: real Circle Gateway batched x402 settlement on Arc.
  if (isGatewayBuyerConfigured()) {
    return NextResponse.json(
      await agentGatewayPay(parsed.data.url, {
        depositUsd: parsed.data.deposit_usd,
      }),
    );
  }

  if (!agent.address && !agent.configured) {
    return NextResponse.json(
      await agent.autonomousX402Pay(parsed.data.url, appBase),
    );
  }

  if (!agent.configured) {
    return NextResponse.json(
      { detail: "Dynamic server wallet not configured. Set DYNAMIC_API_TOKEN." },
      { status: 503 },
    );
  }

  if (!agent.address) {
    await agent.initialize();
  }

  return NextResponse.json(
    await agent.autonomousX402Pay(parsed.data.url, appBase),
  );
}
