import { NextResponse } from "next/server";
import twilio from "twilio";
import { processMessage } from "@/core/payments";
import { resolveSenderWallet } from "@/core/senders/resolver";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.scoped("webhook:twilio");

/**
 * POST /api/webhooks/twilio
 *
 * Inbound SMS / WhatsApp webhook. Twilio posts form-encoded payloads; we map
 * the message body to the shared orchestrator and reply with TwiML so the user
 * gets a confirmation in the same thread.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const form = Object.fromEntries(params.entries());
  const body = String(form.Body ?? "").trim();
  const from = String(form.From ?? "");
  const isWhatsApp = from.startsWith("whatsapp:");

  if (!isValidTwilioRequest(request, form)) {
    return new NextResponse("<Response/>", {
      status: 403,
      headers: { "Content-Type": "text/xml" },
    });
  }

  if (!body || !from) {
    return new NextResponse("<Response/>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  let replyText = "Got it.";
  try {
    const sender = await resolveSenderWallet({
      kind: "phone",
      value: from,
      label: from.replace("whatsapp:", ""),
    });
    if (!sender) {
      return twiml(
        "Please connect a verified Pear Pay wallet before sending funds from this number.",
        401,
      );
    }

    const result = await processMessage(
      body,
      sender,
      { channel: isWhatsApp ? "whatsapp" : "sms" },
    );
    replyText = result.summary;
  } catch (err) {
    log.error("twilio webhook failed", { err: String(err) });
    replyText = "Something went wrong with that payment. Please try again.";
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
    replyText,
  )}</Message></Response>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function twiml(message: string, status = 200): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
      message,
    )}</Message></Response>`,
    {
      status,
      headers: { "Content-Type": "text/xml" },
    },
  );
}

function isValidTwilioRequest(
  request: Request,
  params: Record<string, string>,
): boolean {
  const env = getEnv();
  const signature = request.headers.get("x-twilio-signature");
  if (!env.TWILIO_AUTH_TOKEN) {
    return env.NODE_ENV !== "production";
  }
  if (!signature) return false;
  const url =
    env.TWILIO_WEBHOOK_URL ??
    `${env.APP_URL.replace(/\/$/, "")}/api/webhooks/twilio`;
  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
