import { handleInbound } from "./handler";
import type { OutboundReply } from "./types";

/**
 * Discord channel adapter.
 *
 * Supports the `/pay @user <amount>` slash command described in the README by
 * normalizing the interaction into a natural-language message the shared
 * orchestrator already understands.
 */
export interface DiscordPayCommand {
  userId: string;
  username: string;
  targetMention: string; // e.g. "@molly"
  amount: string; // e.g. "20"
  memo?: string;
  private?: boolean;
}

export interface DiscordSenderResolver {
  (discordUserId: string): Promise<`0x${string}`>;
}

export async function handleDiscordPay(
  command: DiscordPayCommand,
  resolveSender: DiscordSenderResolver,
): Promise<OutboundReply> {
  const address = await resolveSender(command.userId);
  const privacy = command.private ? " privately" : "";
  const memo = command.memo ? ` for ${command.memo}` : "";
  const text = `Send ${command.targetMention} $${command.amount}${privacy}${memo}`;

  return handleInbound({
    text,
    sender: { label: `@${command.username}`, address },
    context: { channel: "discord" },
  });
}
