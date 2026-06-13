import { NextResponse } from "next/server";
import { processMessage } from "@/core/payments";
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
  const form = await request.formData();
  const body = String(form.get("Body") ?? "").trim();
  const from = String(form.get("From") ?? "");
  const isWhatsApp = from.startsWith("whatsapp:");

  if (!body || !from) {
    return new NextResponse("<Response/>", {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // The sender's wallet would be resolved from their verified phone number; for
  // the MVP we use a deterministic placeholder address.
  const senderAddress =
    `0x${Buffer.from(from).toString("hex").padEnd(40, "0").slice(0, 40)}` as `0x${string}`;

  let replyText = "Got it.";
  try {
    const result = await processMessage(
      body,
      { label: from.replace("whatsapp:", ""), address: senderAddress },
      { channel: isWhatsApp ? "whatsapp" : "sms" },
    );
    replyText = result.summary;
  } catch (err) {
    log.error("twilio webhook failed", { err: String(err) });
    replyText = "Something went wrong with that payment. Please try again.";
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
    replyText,
  )}</Message></Response>`;
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
