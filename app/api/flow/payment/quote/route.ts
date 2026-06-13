import { NextResponse } from "next/server";
import { z } from "zod";
import { FlowError, getFlowClient } from "@/integrations/flow/client";

const bodySchema = z.object({
  intent_id: z.string().min(1),
  from_token_address: z.string().min(1),
  slippage: z.number().default(0.01),
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
    const quoted = await flow.getQuote(
      session.transaction_id,
      session.session_token,
      {
        fromTokenAddress: parsed.data.from_token_address,
        slippage: parsed.data.slippage,
      },
    );
    const quote = (quoted.quote ?? {}) as Record<string, unknown>;
    const fees = (quote.fees ?? {}) as Record<string, unknown>;
    return NextResponse.json({
      execution_state: quoted.executionState,
      from_amount: quote.fromAmount,
      to_amount: quote.toAmount,
      fees_usd: fees.totalFeeUsd,
      estimated_time_sec: quote.estimatedTimeSec,
      quote_version: quoted.quoteVersion,
    });
  } catch (err) {
    if (err instanceof FlowError) {
      return NextResponse.json({ detail: err.detail }, { status: err.status });
    }
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
