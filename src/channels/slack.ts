import { handleInbound } from "./handler";
import type { OutboundReply } from "./types";

/**
 * Slack channel adapter.
 *
 * Handles slash commands and message events, including the README's
 * "Split lunch with the engineering team" group-payment flow.
 */
export interface SlackCommand {
  userId: string;
  userName: string;
  text: string;
}

export interface SlackSenderResolver {
  (slackUserId: string): Promise<`0x${string}`>;
}

export async function handleSlackCommand(
  command: SlackCommand,
  resolveSender: SlackSenderResolver,
): Promise<OutboundReply> {
  const address = await resolveSender(command.userId);
  return handleInbound({
    text: command.text,
    sender: { label: `@${command.userName}`, address },
    context: { channel: "slack" },
  });
}
