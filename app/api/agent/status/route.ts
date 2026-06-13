import { NextResponse } from "next/server";
import { getAgentService } from "@/core/agents/wallet";

export async function GET() {
  const agent = getAgentService();
  return NextResponse.json({
    configured: agent.configured,
    wallet_address: agent.address,
    capabilities: [
      "server_wallet_mpc",
      "autonomous_x402_payment",
      "flow_cross_chain_funding",
    ],
    story:
      "Agent proposes → human FaceID approves user payment → agent autonomously pays APIs",
  });
}
