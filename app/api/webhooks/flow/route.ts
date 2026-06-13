import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getFlowClient } from "@/integrations/flow/client";

const settlementLog: Array<Record<string, unknown>> = [];

function verifyHmac(
  payload: Buffer,
  signature: string | null,
  secret: string,
): boolean {
  if (!secret || !signature) return !secret;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body = Buffer.from(await request.arrayBuffer());
  const env = getEnv();
  const signature = request.headers.get("x-dynamic-signature");

  if (
    env.DYNAMIC_FLOW_WEBHOOK_SECRET &&
    !verifyHmac(body, signature, env.DYNAMIC_FLOW_WEBHOOK_SECRET)
  ) {
    return NextResponse.json({ detail: "Invalid webhook signature" }, { status: 401 });
  }

  const data = JSON.parse(body.toString()) as {
    eventName?: string;
    data?: { transactionId?: string; [key: string]: unknown };
  };
  const eventName = data.eventName ?? "";
  const txId = data.data?.transactionId;

  const record = {
    event: eventName,
    transaction_id: txId,
    payload: data.data ?? {},
  };
  settlementLog.push(record);

  if (eventName === "settlement.state.completed" && txId) {
    const flow = getFlowClient();
    const session = flow.getSessionByTx(txId);
    if (session) {
      flow.markSettled(txId, (data.data ?? {}) as Record<string, unknown>);
    }
  }

  return NextResponse.json({ received: true, event: eventName });
}

export async function GET() {
  return NextResponse.json({ events: settlementLog.slice(-20) });
}
