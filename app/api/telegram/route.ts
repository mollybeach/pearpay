import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { handleTelegramUpdate, type TelegramUpdate } from "@/channels/telegram";

// Calls processMessage (Arc/Unlink rails) -> Node runtime, not Edge.
export const runtime = "nodejs";

const log = logger.scoped("telegram:webhook");

/** Telegram includes `message.chat.id` (needed to reply) beyond our adapter type. */
type TelegramUpdateWithChat = TelegramUpdate & {
  message?: { chat?: { id?: number } };
};

async function tgSend(token: string, chatId: number, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    log.warn("telegram sendMessage failed", { err: String(err) });
  }
}

/**
 * Live Telegram bot webhook. Set it once after deploy:
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://pearpay.app/api/telegram&secret_token=<SECRET>"
 *
 * Then DM the bot e.g. "Send 0.01 USDC privately to 0xabc…" — PearPay parses the
 * intent, runs the same orchestrator the web app uses, and replies in-chat.
 */
export async function POST(request: Request) {
  const env = getEnv();
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, detail: "TELEGRAM_BOT_TOKEN not set" },
      { status: 503 },
    );
  }

  // Telegram echoes the secret you registered with setWebhook.
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== env.TELEGRAM_WEBHOOK_SECRET) {
      log.warn("telegram webhook secret mismatch");
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TelegramUpdateWithChat;
  try {
    update = (await request.json()) as TelegramUpdateWithChat;
  } catch {
    return NextResponse.json({ ok: true }); // ack malformed so Telegram stops retrying
  }

  // Demo sender resolver: every Telegram user maps to PearPay's agent wallet.
  // (Production would look the user up in Dynamic and create/return their wallet.)
  const senderAddress = (env.AGENT_WALLET_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

  let reply;
  try {
    reply = await handleTelegramUpdate(update, async () => senderAddress);
  } catch (err) {
    log.warn("telegram handler error", { err: String(err) });
    reply = { text: "Could not process that payment — please try again." };
  }

  const chatId = update.message?.chat?.id ?? update.message?.from?.id;
  if (reply && typeof chatId === "number") {
    await tgSend(token, chatId, reply.text);
  }

  // Always 200 quickly so Telegram doesn't redeliver.
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    detail: "PearPay Telegram webhook. POST Telegram updates here.",
  });
}
