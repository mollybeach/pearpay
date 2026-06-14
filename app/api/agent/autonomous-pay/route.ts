import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getAgentService } from "@/core/agents/wallet";
import {
  agentGatewayPay,
  isGatewayBuyerConfigured,
} from "@/integrations/arc/x402-gateway";

const bodySchema = z.object({
  // Optional — defaults to THIS deployment's paywalled resource. A hardcoded
  // localhost default fails on Vercel (the function can't fetch localhost:3000).
  url: z.string().url().optional(),
  deposit_usd: z.string().optional(),
});

export async function POST(request: Request) {
  const agent = getAgentService();
  const env = getEnv();
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? env.APP_URL;
  const appBase = (
    fromEnv && !fromEnv.includes("localhost")
      ? fromEnv
      : new URL(request.url).origin
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

  const url = parsed.data.url ?? `${appBase}/api/x402/premium/data`;

  // Preferred path: real Circle Gateway batched x402 settlement on Arc.
  if (isGatewayBuyerConfigured()) {
    return NextResponse.json(
      await agentGatewayPay(url, {
        depositUsd: parsed.data.deposit_usd,
      }),
    );
  }

  if (!agent.address && !agent.configured) {
    return NextResponse.json(
      await agent.autonomousX402Pay(url, appBase),
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
    await agent.autonomousX402Pay(url, appBase),
  );
}
