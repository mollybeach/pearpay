import { handleInbound } from "./handler";
import type { OutboundReply } from "./types";

/**
 * Telegram channel adapter.
 *
 * Maps a Telegram Bot API update into the shared InboundMessage shape. The
 * sender's Pear Pay wallet is resolved upstream from their Telegram user id.
 */
export interface TelegramUpdate {
  message?: {
    text?: string;
    from?: { id: number; username?: string };
  };
}

export interface TelegramSenderResolver {
  /** Map a Telegram user id to their Pear Pay wallet address. */
  (telegramUserId: number): Promise<`0x${string}`>;
}

export async function handleTelegramUpdate(
  update: TelegramUpdate,
  resolveSender: TelegramSenderResolver,
): Promise<OutboundReply | null> {
  const text = update.message?.text;
  const from = update.message?.from;
  if (!text || !from) return null;

  const address = await resolveSender(from.id);
  return handleInbound({
    text,
    sender: {
      label: from.username ? `@${from.username}` : `tg:${from.id}`,
      address,
    },
    context: { channel: "telegram" },
  });
}
