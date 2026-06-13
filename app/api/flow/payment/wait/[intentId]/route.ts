import { NextResponse } from "next/server";
import { FlowError, getFlowClient } from "@/integrations/flow/client";

export async function POST(
  _request: Request,
  { params }: { params: { intentId: string } },
) {
  const flow = getFlowClient();
  const session = flow.getSession(params.intentId);
  if (!session) {
    return NextResponse.json({ detail: "Flow session not found" }, { status: 404 });
  }

  try {
    const tx = await flow.pollSettlement(session.transaction_id);
    flow.markSettled(session.transaction_id, tx);
    return NextResponse.json({
      completed: true,
      settlement_state: tx.settlementState,
      transaction_id: session.transaction_id,
    });
  } catch (err) {
    if (err instanceof FlowError) {
      return NextResponse.json({ detail: err.detail }, { status: err.status });
    }
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
