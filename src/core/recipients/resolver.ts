import { lookupPearPayUser } from "@/integrations/dynamic";
import { logger } from "@/lib/logger";
import type { RawRecipient, RecipientHint } from "@/core/nlp/types";
import type {
  DeliveryMode,
  NotificationChannel,
  ResolutionContext,
  ResolvedRecipient,
} from "./types";

const log = logger.scoped("recipients");

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function channelForHint(
  hint: RecipientHint,
  ctx: ResolutionContext,
): NotificationChannel {
  switch (hint) {
    case "phone":
      return ctx.channel === "whatsapp" ? "whatsapp" : "sms";
    case "email":
      return "email";
    case "handle":
      if (ctx.channel === "telegram") return "telegram";
      if (ctx.channel === "discord") return "discord";
      return "sms";
    default:
      return "sms";
  }
}

/**
 * Resolve a single raw recipient reference into a concrete delivery target.
 *
 * Resolution order mirrors the README's Universal Recipient Resolution:
 *   1. Existing Pear Pay user  → instant settlement.
 *   2. Discoverable wallet → instant delivery to address.
 *   3. New user                → claimable escrow + notification.
 */
export async function resolveRecipient(
  recipient: RawRecipient,
  ctx: ResolutionContext = {},
): Promise<ResolvedRecipient> {
  const { raw, hint } = recipient;

  // 0. A raw EVM address is a direct, instant on-chain recipient (Arc settles
  //    straight to it — no claim flow).
  if (hint === "address" || /^0x[a-fA-F0-9]{40}$/.test(raw)) {
    const address = raw as `0x${string}`;
    log.info("resolved raw address recipient", { address });
    return {
      raw,
      hint: "address",
      label: `${address.slice(0, 6)}…${address.slice(-4)}`,
      address,
      isPearPayUser: false,
      deliveryMode: "instant",
      notificationChannel: "none",
    };
  }

  // 1. Existing Pear Pay user (looked up across known identifiers).
  const pearPayUser = await lookupPearPayUser(raw);
  if (pearPayUser) {
    log.info("resolved existing pear pay user", { raw });
    return {
      raw,
      hint,
      label: pearPayUser.address,
      address: pearPayUser.address,
      isPearPayUser: true,
      deliveryMode: "instant",
      notificationChannel: "none",
    };
  }


  // 3. New user — build a claimable target with the right notification channel.
  const contact =
    hint === "phone"
      ? normalizePhone(raw)
      : hint === "email"
        ? raw.toLowerCase()
        : raw.replace(/^@/, "");

  const deliveryMode: DeliveryMode = "claimable";
  const notificationChannel = channelForHint(hint, ctx);

  log.info("recipient requires claimable payment", {
    raw,
    notificationChannel,
  });

  return {
    raw,
    hint,
    label: contact,
    isPearPayUser: false,
    deliveryMode,
    notificationChannel,
    contact,
  };
}

/** Resolve every recipient in an intent, preserving order. */
export async function resolveRecipients(
  recipients: RawRecipient[],
  ctx: ResolutionContext = {},
): Promise<ResolvedRecipient[]> {
  return Promise.all(recipients.map((r) => resolveRecipient(r, ctx)));
}
