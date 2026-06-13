import twilio from "twilio";
import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.scoped("twilio");

/**
 * Twilio integration — recipient discovery and claim delivery.
 *
 * Twilio solves the cold-start problem: it reaches recipients who do not yet
 * have a wallet via SMS / WhatsApp claim links, verifies phone numbers, and
 * backs the Voice AI payment demo.
 */

let cachedClient: ReturnType<typeof twilio> | null = null;

function client() {
  if (cachedClient) return cachedClient;
  const env = getEnv();
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    assertConfiguredForProduction("twilio", false);
    return null;
  }
  cachedClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return cachedClient;
}

export interface ClaimMessage {
  to: string;
  senderLabel: string;
  amountDisplay: string;
  claimUrl: string;
  channel: "sms" | "whatsapp";
}

function buildBody(msg: ClaimMessage): string {
  return `${msg.senderLabel} sent you ${msg.amountDisplay} through Pear Pay.\n\nClaim your funds:\n${msg.claimUrl}`;
}

/** Send an SMS or WhatsApp claim link to a recipient. */
export async function sendClaimLink(
  msg: ClaimMessage,
): Promise<{ sid: string; delivered: boolean }> {
  const env = getEnv();
  const c = client();
  const body = buildBody(msg);

  if (!c) {
    log.debug("twilio not configured; would send claim link", {
      to: msg.to,
      channel: msg.channel,
    });
    return { sid: `local_${Date.now()}`, delivered: false };
  }

  const to = msg.channel === "whatsapp" ? `whatsapp:${msg.to}` : msg.to;
  const from =
    msg.channel === "whatsapp"
      ? `whatsapp:${env.TWILIO_FROM_NUMBER ?? ""}`
      : env.TWILIO_FROM_NUMBER;
  if (!env.TWILIO_MESSAGING_SERVICE_SID && !from) {
    assertConfiguredForProduction("twilio", false);
    throw new Error("Twilio sender is not configured");
  }

  const result = await c.messages.create({
    to,
    body,
    ...(env.TWILIO_MESSAGING_SERVICE_SID
      ? { messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID }
      : { from }),
  });

  log.info("claim link sent", { sid: result.sid, channel: msg.channel });
  return { sid: result.sid, delivered: true };
}

/** Start a Twilio Verify phone verification for a high-value transfer. */
export async function startVerification(
  phone: string,
): Promise<{ status: string }> {
  const env = getEnv();
  const c = client();
  if (!c || !env.TWILIO_VERIFY_SERVICE_SID) {
    assertConfiguredForProduction("twilio", false);
    return { status: "skipped" };
  }
  const verification = await c.verify.v2
    .services(env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to: phone, channel: "sms" });
  return { status: verification.status };
}

/** Check a Twilio Verify code to confirm a recipient before release. */
export async function checkVerification(
  phone: string,
  code: string,
): Promise<{ approved: boolean }> {
  const env = getEnv();
  const c = client();
  if (!c || !env.TWILIO_VERIFY_SERVICE_SID) {
    assertConfiguredForProduction("twilio", false);
    return { approved: true };
  }
  const check = await c.verify.v2
    .services(env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phone, code });
  return { approved: check.status === "approved" };
}
