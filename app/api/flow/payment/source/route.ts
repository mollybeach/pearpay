import { NextResponse } from "next/server";
import { z } from "zod";
import { FlowError, getFlowClient } from "@/integrations/flow/client";

const bodySchema = z.object({
  intent_id: z.string().min(1),
  from_address: z.string().min(1),
  from_chain_id: z.string().min(1),
  from_chain_name: z.string().default("EVM"),
});

export async function POST(request: Request) {
  const flow = getFlowClient();
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ detail: "invalid_request" }, { status: 400 });
  }

  const session = flow.getSession(parsed.data.intent_id);
  if (!session) {
    return NextResponse.json({ detail: "Flow session not found" }, { status: 404 });
  }

  try {
    const tx = await flow.attachSource(
      session.transaction_id,
      session.session_token,
      {
        fromAddress: parsed.data.from_address,
        fromChainId: parsed.data.from_chain_id,
        fromChainName: parsed.data.from_chain_name,
      },
    );
    return NextResponse.json({
      execution_state: tx.executionState,
      risk_state: tx.riskState,
    });
  } catch (err) {
    if (err instanceof FlowError) {
      return NextResponse.json({ detail: err.detail }, { status: err.status });
    }
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
