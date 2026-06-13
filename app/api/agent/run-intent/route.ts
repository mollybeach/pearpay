import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getAgentService } from "@/core/agents/wallet";

const bodySchema = z.object({
  text: z.string().min(1),
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
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const text = parsed.data.text.toLowerCase();

  if (
    text.includes("premium") ||
    text.includes("intelligence") ||
    text.includes("dataset")
  ) {
    const url = `${appBase}/api/x402/premium/data`;
    agent.logAction("parse_intent", {
      text: parsed.data.text,
      resolved_url: url,
    });
    const result = await agent.autonomousX402Pay(url, appBase);
    return NextResponse.json(result);
  }

  if (text.includes("pay") || text.includes("agent")) {
    return NextResponse.json({
      autonomous: false,
      message: "Human approval required via FaceID + Flow checkout",
      proposer_only: true,
    });
  }

  return NextResponse.json(
    { detail: "Could not resolve agent intent" },
    { status: 422 },
  );
}
