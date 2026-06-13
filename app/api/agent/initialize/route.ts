import { NextResponse } from "next/server";
import { getAgentService } from "@/core/agents/wallet";

export async function POST() {
  const agent = getAgentService();
  const result = await agent.initialize();
  return NextResponse.json(result);
}
