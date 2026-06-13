import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();
  const configured = Boolean(env.FUNDER_PRIVATE_KEY && env.ARC_RPC_URL);
  return NextResponse.json({
    configured,
    arc_rpc: env.ARC_RPC_URL,
    gateway: env.X402_GATEWAY_ADDRESS ?? "not_set",
    note: "Wire Circle GatewayClient in agent loop for production x402",
  });
}
