import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getFlowClient } from "@/integrations/flow/client";

export async function GET() {
  const flow = getFlowClient();
  const env = getEnv();
  return NextResponse.json({
    configured: flow.configured,
    environment_id: env.DYNAMIC_ENV_ID ?? null,
    checkout_id: env.DYNAMIC_FLOW_CHECKOUT_ID ?? null,
    arc_chain_id: flow.arcChainId,
    note: "Fireblocks Flow: pay from any chain, settle USDC on Arc",
  });
}
