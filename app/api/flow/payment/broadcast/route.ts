import { NextResponse } from "next/server";
import { z } from "zod";
import { FlowError, getFlowClient } from "@/integrations/flow/client";

const bodySchema = z.object({
  intent_id: z.string().min(1),
  tx_hash: z.string().min(1),
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
    const result = await flow.recordBroadcast(
      session.transaction_id,
      session.session_token,
      parsed.data.tx_hash,
    );
    return NextResponse.json({
      execution_state: result.executionState,
      settlement_state: result.settlementState,
      transaction_id: session.transaction_id,
    });
  } catch (err) {
    if (err instanceof FlowError) {
      return NextResponse.json({ detail: err.detail }, { status: err.status });
    }
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
