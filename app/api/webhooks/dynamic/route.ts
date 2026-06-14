import { createHmac, timingSafeEqual } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import {
  type DelegationWebhookData,
  ingestDelegation,
  revokeDelegation,
} from "@/integrations/dynamic/delegated-wallet";

// Native Dynamic wallet SDK -> Node runtime, never Edge.
export const runtime = "nodejs";

const log = logger.scoped("webhook:dynamic");
const WEBHOOK_LOG = path.join(process.cwd(), ".dynamic-webhook-log.json");

// In-memory idempotency guard (per warm server). Dynamic recommends using
// eventId as the idempotency key for replays.
const seenEvents = new Set<string>();

function verifySignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = `sha256=${digest}`;
  const a = Buffer.from(expected, "ascii");
  const b = Buffer.from(signature, "ascii");
  return a.length === b.length && timingSafeEqual(a, b);
}

function appendLog(entry: Record<string, unknown>): void {
  let events: Array<Record<string, unknown>> = [];
  try {
    if (existsSync(WEBHOOK_LOG)) {
      events = JSON.parse(readFileSync(WEBHOOK_LOG, "utf8"));
    }
  } catch {
    events = [];
  }
  events.push({ ...entry, received_at: new Date().toISOString() });
  try {
    writeFileSync(WEBHOOK_LOG, JSON.stringify(events.slice(-100), null, 2));
  } catch (err) {
    log.warn("webhook log write failed", { err: String(err) });
  }
}

export async function POST(request: Request) {
  // Hash the RAW body exactly as received — re-serializing would change bytes
  // and break HMAC verification.
  const rawBody = await request.text();
  const env = getEnv();
  const signature = request.headers.get("x-dynamic-signature-256");
  const secret = env.DYNAMIC_DELEGATION_WEBHOOK_SECRET;

  if (secret) {
    if (!verifySignature(rawBody, signature, secret)) {
      log.warn("invalid webhook signature");
      return NextResponse.json(
        { detail: "Invalid webhook signature" },
        { status: 401 },
      );
    }
  } else if (env.NODE_ENV === "production") {
    return NextResponse.json(
      { detail: "Delegation webhook secret not configured" },
      { status: 503 },
    );
  } else {
    log.warn("no webhook secret set — skipping verification (dev only)");
  }

  let body: {
    eventName?: string;
    messageType?: string;
    eventId?: string;
    data?: DelegationWebhookData & { walletId?: string };
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const eventName = body.eventName ?? body.messageType ?? "";
  const eventId = body.eventId ?? "";

  if (eventId && seenEvents.has(eventId)) {
    return NextResponse.json({ received: true, deduplicated: true });
  }
  if (eventId) seenEvents.add(eventId);

  try {
    if (eventName === "wallet.delegation.created") {
      const data = body.data as DelegationWebhookData;
      const record = await ingestDelegation(data);
      appendLog({
        event: eventName,
        eventId,
        walletId: data?.walletId,
        stored: Boolean(record),
      });
    } else if (eventName === "wallet.delegation.revoked") {
      const walletId = body.data?.walletId;
      if (walletId) revokeDelegation(walletId);
      appendLog({ event: eventName, eventId, walletId });
    } else {
      appendLog({ event: eventName, eventId, note: "ignored" });
    }
  } catch (err) {
    // Log and 200 so Dynamic does not retry-storm on our processing bugs; the
    // failure is captured for replay via the dashboard using eventId.
    log.warn("delegation webhook processing failed", { err: String(err) });
    return NextResponse.json({ received: true, processed: false });
  }

  return NextResponse.json({ received: true, event: eventName });
}

export async function GET() {
  if (!existsSync(WEBHOOK_LOG)) return NextResponse.json({ events: [] });
  try {
    const events = JSON.parse(readFileSync(WEBHOOK_LOG, "utf8"));
    return NextResponse.json({ events: events.slice(-20) });
  } catch {
    return NextResponse.json({ events: [] });
  }
}
