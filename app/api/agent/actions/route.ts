import { NextResponse } from "next/server";
import { getAgentService } from "@/core/agents/wallet";

export async function GET() {
  const agent = getAgentService();
  return NextResponse.json({ actions: agent.getActions() });
}
