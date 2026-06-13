import { createHmac, timingSafeEqual } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { getFlowClient } from "@/integrations/flow/client";

const WEBHOOK_LOG = path.join(process.cwd(), ".flow-webhook-log.json");

function loadWebhookLog(): Array<Record<string, unknown>> {
  if (!existsSync(WEBHOOK_LOG)) return [];
  try {
    return JSON.parse(readFileSync(WEBHOOK_LOG, "utf8")) as Array<
      Record<string, unknown>
    >;
  } catch {
    return [];
  }
}

function saveWebhookLog(events: Array<Record<string, unknown>>): void {
  writeFileSync(WEBHOOK_LOG, JSON.stringify(events.slice(-50), null, 2));
}

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

  if (env.DYNAMIC_FLOW_WEBHOOK_SECRET) {
    if (!verifyHmac(body, signature, env.DYNAMIC_FLOW_WEBHOOK_SECRET)) {
      return NextResponse.json(
        { detail: "Invalid webhook signature" },
        { status: 401 },
      );
    }
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
    received_at: new Date().toISOString(),
  };

  const log = loadWebhookLog();
  log.push(record);
  saveWebhookLog(log);

  if (
    (eventName === "settlement.state.completed" ||
      eventName === "execution.state.settled") &&
    txId
  ) {
    const flow = getFlowClient();
    flow.markSettled(txId, (data.data ?? {}) as Record<string, unknown>);
  }

  return NextResponse.json({ received: true, event: eventName });
}

export async function GET() {
  return NextResponse.json({ events: loadWebhookLog().slice(-20) });
}
