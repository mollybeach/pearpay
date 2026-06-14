import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { parseIntent } from "@/core/nlp";
import { processMessage } from "@/core/payments";
import { formatUsdc, formatUsdcDisplay } from "@/lib/money";
import type { Sender } from "@/core/payments/types";

// Settles via Arc/Unlink rails -> Node runtime, not Edge.
export const runtime = "nodejs";
export const maxDuration = 120;

const log = logger.scoped("telegram:webhook");

/** Minimal slices of the Telegram update shape we use. */
interface TgUpdate {
  message?: {
    text?: string;
    chat?: { id?: number };
    from?: { id: number; username?: string };
  };
  callback_query?: {
    id: string;
    data?: string;
    from?: { id: number; username?: string };
    message?: { chat?: { id?: number }; message_id?: number };
  };
}

async function tg(token: string, method: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    log.warn("telegram api call failed", { method, err: String(err) });
    return null;
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const GREETING =
  "👋 I'm the <b>Pear Pay</b> bot. Tell me who to pay — e.g. " +
  '"Send Molly $20" or "Send 0.05 USDC privately to 0x…".';

/** Pack a payment into <=64-byte callback_data: p|<amountRaw>|<recipient>|<priv> */
function packPay(amountRaw: bigint, recipient: string, priv: boolean): string {
  return `p|${amountRaw}|${recipient}|${priv ? 1 : 0}`;
}

export async function POST(request: Request) {
  const env = getEnv();
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, detail: "TELEGRAM_BOT_TOKEN not set" }, { status: 503 });
  }

  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== env.TELEGRAM_WEBHOOK_SECRET) {
      log.warn("telegram webhook secret mismatch");
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const sender: Sender = {
    label: "telegram-user",
    address: (env.AGENT_WALLET_ADDRESS ??
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
  };

  try {
    if (update.callback_query) {
      await handleCallback(token, update.callback_query, sender);
    } else if (update.message) {
      await handleMessage(token, update.message);
    }
  } catch (err) {
    log.warn("telegram handler error", { err: String(err) });
  }

  // Always ack fast so Telegram doesn't redeliver.
  return NextResponse.json({ ok: true });
}

async function handleMessage(
  token: string,
  message: NonNullable<TgUpdate["message"]>,
) {
  const chatId = message.chat?.id ?? message.from?.id;
  const text = message.text?.trim();
  if (typeof chatId !== "number" || !text) return;

  if (text === "/start" || text === "/help") {
    await tg(token, "sendMessage", { chat_id: chatId, text: GREETING, parse_mode: "HTML" });
    return;
  }

  const intent = parseIntent(text);
  const recipient = intent.recipients[0]?.raw;
  if ((intent.type !== "send" && intent.type !== "split") || intent.amount === undefined || !recipient) {
    await tg(token, "sendMessage", { chat_id: chatId, text: GREETING, parse_mode: "HTML" });
    return;
  }

  const amountDisplay = formatUsdcDisplay(intent.amount);
  const privacy = intent.private ? "  🔒 private" : "";
  const card =
    `🍐 <b>Pear Pay</b>\n` +
    `Send <b>${amountDisplay}</b> to <b>${esc(recipient)}</b>?\n` +
    `<i>Routes via Arc · settles in USDC${privacy}</i>`;

  // callback_data must be <=64 bytes; fall back to a short label if it overflows.
  const payData = packPay(intent.amount, recipient, intent.private);
  await tg(token, "sendMessage", {
    chat_id: chatId,
    text: card,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: `💸 Pay ${amountDisplay}`, callback_data: payData.slice(0, 64) },
          { text: "✖ Cancel", callback_data: "c" },
        ],
      ],
    },
  });
}

async function handleCallback(
  token: string,
  cb: NonNullable<TgUpdate["callback_query"]>,
  sender: Sender,
) {
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const data = cb.data ?? "";
  await tg(token, "answerCallbackQuery", { callback_query_id: cb.id });
  if (typeof chatId !== "number" || typeof messageId !== "number") return;

  if (data === "c" || data.startsWith("c")) {
    await tg(token, "editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: "✖ <b>Payment cancelled.</b>",
      parse_mode: "HTML",
    });
    return;
  }

  if (!data.startsWith("p|")) return;
  const [, amountRaw, recipient, priv] = data.split("|");
  if (!amountRaw || !recipient) return;
  const amountUsd = formatUsdc(BigInt(amountRaw));
  const amountDisplay = formatUsdcDisplay(BigInt(amountRaw));
  const isPrivate = priv === "1";

  // Show the "Confirming…" state on the original card (keyboard removed).
  const baseCard =
    `🍐 <b>Pear Pay</b>\n` +
    `Send <b>${amountDisplay}</b> to <b>${esc(recipient)}</b>?\n` +
    `<i>Routes via Arc · settles in USDC</i>`;
  await tg(token, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: `${baseCard}\n\n⏳ <i>Confirming…</i>`,
    parse_mode: "HTML",
  });

  // Settle through the same orchestrator the web app uses.
  const reconstructed = `Send ${recipient} ${amountUsd} USDC${isPrivate ? " privately" : ""}`;
  const result = await processMessage(reconstructed, sender, { channel: "telegram" });
  const leg = result.legs[0];

  await tg(token, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: `${baseCard}\n\n${result.ok ? "✅ <b>Confirmed</b>" : "⚠️ <b>Could not settle</b>"}`,
    parse_mode: "HTML",
  });

  if (!result.ok || !leg) {
    await tg(token, "sendMessage", {
      chat_id: chatId,
      text: `⚠️ ${esc(result.summary || "Payment failed — please try again.")}`,
      parse_mode: "HTML",
    });
    return;
  }

  // Build the settled-receipt card.
  const railTag = isPrivate ? "🕶️ Unlink" : "🔵 Arc";
  const modeTag = leg.outcome === "instant" ? (isPrivate ? "private" : "instant") : "claimable";
  const receipt =
    `🍐  <b>SETTLED ✅</b>\n` +
    `<b>${amountDisplay}</b>\n` +
    `You paid <b>${esc(recipient)}</b>\n` +
    `${railTag} · USDC · ${modeTag}`;
  await tg(token, "sendMessage", { chat_id: chatId, text: receipt, parse_mode: "HTML" });

  // Follow-up line + actionable links (explorer proof / claim link).
  const explorer = (env_explorer()).replace(/\/$/, "");
  const lines: string[] = [`✅ Sent <b>${amountDisplay}</b> to <b>${esc(recipient)}</b>. Settled in USDC.`];
  if (leg.txHash) lines.push(`Proof: ${explorer}/tx/${leg.txHash}`);
  else if (isPrivate) lines.push(`🔒 Shielded via Unlink — no public ledger link.`);
  if (leg.claimUrl) lines.push(`Claim link: ${leg.claimUrl}`);
  await tg(token, "sendMessage", { chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML" });
}

function env_explorer(): string {
  return getEnv().NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";
}

export async function GET() {
  return NextResponse.json({ ok: true, detail: "PearPay Telegram webhook." });
}
