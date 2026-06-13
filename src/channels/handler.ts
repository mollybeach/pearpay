import { logger } from "@/lib/logger";
import { processMessage } from "@/core/payments";
import type { InboundMessage, OutboundReply } from "./types";

const log = logger.scoped("channel");

/**
 * Shared entry point for every channel. Telegram, Discord, Slack, WhatsApp,
 * SMS, and Voice all normalize into InboundMessage and call this, guaranteeing
 * identical payment behavior regardless of where the message originated.
 */
export async function handleInbound(
  msg: InboundMessage,
): Promise<OutboundReply> {
  log.info("inbound message", {
    channel: msg.context.channel,
    sender: msg.sender.label,
  });

  try {
    const result = await processMessage(msg.text, msg.sender, msg.context);
    return { text: result.summary };
  } catch (err) {
    log.error("channel handler failed", { err: String(err) });
    return {
      text: "Something went wrong processing that payment. Please try again.",
    };
  }
}
