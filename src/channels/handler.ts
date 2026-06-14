import { logger } from "@/lib/logger";
import { processMessage } from "@/core/payments";
import { getEnv } from "@/lib/env";
import type { PaymentResult } from "@/core/payments/types";
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
    return { text: buildReplyText(result) };
  } catch (err) {
    log.error("channel handler failed", { err: String(err) });
    return {
      text: "Something went wrong processing that payment. Please try again.",
    };
  }
}

/**
 * Compose the in-chat reply. Beyond the human summary we surface the actionable
 * links the demo depends on: the tappable PearPay payment card (unfurls into an
 * OG preview in Telegram/iMessage), the on-chain settlement proof on ArcScan,
 * and any claim link. The card link goes first so messengers unfurl it.
 */
export function buildReplyText(result: PaymentResult): string {
  const lines: string[] = [result.summary];

  if (result.payUrl) {
    lines.push("", `Tap to open the payment card:`, result.payUrl);
  }

  const explorer = (
    getEnv().NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app"
  ).replace(/\/$/, "");

  for (const leg of result.legs) {
    if (leg.txHash) {
      // Public Arc settlement — verifiable on the explorer.
      lines.push("", "Arc settlement proof:", `${explorer}/tx/${leg.txHash}`);
    } else if (leg.private && leg.settlementRef) {
      // Private (Unlink) rail — by design there is NO public link; the amount
      // and counterparty are shielded. We surface only the shielded note ref.
      lines.push(
        "",
        `🔒 Settled privately via the Unlink shielded pool (note ${shorten(
          leg.settlementRef,
        )}). No public ledger entry links this to the sender.`,
      );
    }
    if (leg.claimUrl) {
      lines.push("", `Claim link for ${leg.recipient.label}:`, leg.claimUrl);
    }
  }

  return lines.join("\n");
}

/** Truncate a long id for display: 0xabc…1234. */
function shorten(ref: string): string {
  return ref.length > 14 ? `${ref.slice(0, 8)}…${ref.slice(-4)}` : ref;
}
