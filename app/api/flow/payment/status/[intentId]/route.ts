import { NextResponse } from "next/server";
import { FlowError, getFlowClient } from "@/integrations/flow/client";

export async function GET(
  _request: Request,
  { params }: { params: { intentId: string } },
) {
  const flow = getFlowClient();
  const session = flow.getSession(params.intentId);
  if (!session) {
    return NextResponse.json({ detail: "Flow session not found" }, { status: 404 });
  }

  try {
    const tx = await flow.getTransaction(session.transaction_id);
    return NextResponse.json({
      transaction_id: session.transaction_id,
      execution_state: tx.executionState,
      settlement_state: tx.settlementState,
      risk_state: tx.riskState,
      completed: tx.settlementState === "completed",
    });
  } catch (err) {
    if (err instanceof FlowError) {
      return NextResponse.json({ detail: err.detail }, { status: err.status });
    }
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
