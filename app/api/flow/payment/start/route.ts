import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { FlowError, getFlowClient } from "@/integrations/flow/client";

const bodySchema = z.object({
  intent_id: z.string().min(1),
  amount: z.number().positive(),
  recipient: z.string().min(10),
});

export async function POST(request: Request) {
  const flow = getFlowClient();
  const env = getEnv();

  if (!flow.configured) {
    return NextResponse.json(
      { detail: "Dynamic Flow not configured" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ detail: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const usdc = env.ARC_USDC_ADDRESS ?? env.NEXT_PUBLIC_ARC_USDC_ADDRESS;
  if (!usdc) {
    return NextResponse.json(
      { detail: "ARC_USDC_ADDRESS not set" },
      { status: 503 },
    );
  }

  try {
    const checkoutId = await flow.ensureCheckout(parsed.data.recipient, usdc);
    const session = await flow.createPayment({
      amount: parsed.data.amount,
      recipient: parsed.data.recipient,
      intentId: parsed.data.intent_id,
      checkoutId,
    });
    return NextResponse.json({
      transaction_id: session.transaction_id,
      session_token: session.session_token,
      checkout_id: checkoutId,
      intent_id: parsed.data.intent_id,
    });
  } catch (err) {
    if (err instanceof FlowError) {
      return NextResponse.json({ detail: err.detail }, { status: err.status });
    }
    return NextResponse.json({ detail: String(err) }, { status: 500 });
  }
}
