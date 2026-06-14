#!/usr/bin/env node
/**
 * Wire up the live PearPay Telegram bot in one command.
 *
 * Prereqs:
 *   1. Create a bot with @BotFather on Telegram, copy the token.
 *   2. Put it in .env:  TELEGRAM_BOT_TOKEN=123456:ABC...
 *   3. Your webhook URL must be PUBLIC https (deployed pearpay.app, or a
 *      tunnel like `cloudflared tunnel --url http://localhost:3000`).
 *
 * Usage:
 *   npm run setup:telegram                       # uses NEXT_PUBLIC_APP_URL / APP_URL
 *   WEBHOOK_URL=https://abc.trycloudflare.com npm run setup:telegram
 *   npm run setup:telegram -- --info             # just show current webhook state
 *   npm run setup:telegram -- --delete           # remove the webhook
 */
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env");
loadEnvFile(".env.local");

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const base = (
  process.env.WEBHOOK_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  "https://pearpay.app"
).replace(/\/$/, "");
const webhookUrl = `${base}/api/telegram`;

const args = process.argv.slice(2);
const wantInfo = args.includes("--info");
const wantDelete = args.includes("--delete");

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!token) {
  fail(
    "TELEGRAM_BOT_TOKEN not set. Create a bot with @BotFather, then add the token to .env",
  );
}

const api = (method) => `https://api.telegram.org/bot${token}/${method}`;

async function call(method, body) {
  const res = await fetch(api(method), {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

console.log("=== PearPay Telegram Setup ===\n");

// Identify the bot so the demo script can @-mention it.
const me = await call("getMe");
if (!me.ok) fail(`Invalid TELEGRAM_BOT_TOKEN: ${JSON.stringify(me)}`);
console.log(`✅ Bot: @${me.result.username} (${me.result.first_name})`);

if (wantDelete) {
  const del = await call("deleteWebhook", { drop_pending_updates: true });
  console.log(del.ok ? "✅ Webhook deleted" : `❌ ${JSON.stringify(del)}`);
  process.exit(del.ok ? 0 : 1);
}

if (!wantInfo) {
  if (!webhookUrl.startsWith("https://")) {
    fail(`Webhook URL must be public https. Got: ${webhookUrl}`);
  }
  const body = {
    url: webhookUrl,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  };
  if (secret) body.secret_token = secret;
  const set = await call("setWebhook", body);
  if (!set.ok) fail(`setWebhook failed: ${JSON.stringify(set)}`);
  console.log(`✅ Webhook set -> ${webhookUrl}`);
  console.log(secret ? "✅ Secret token attached" : "⚠️  No TELEGRAM_WEBHOOK_SECRET (open webhook)");
}

const info = await call("getWebhookInfo");
if (info.ok) {
  const r = info.result;
  console.log("\n--- Webhook status ---");
  console.log(`url:                 ${r.url || "(none)"}`);
  console.log(`pending_updates:     ${r.pending_update_count}`);
  console.log(`has_custom_cert:     ${r.has_custom_certificate}`);
  if (r.last_error_message) {
    console.log(`⚠️  last_error:        ${r.last_error_message} (at ${new Date((r.last_error_date ?? 0) * 1000).toISOString()})`);
  } else {
    console.log("last_error:          none");
  }
}

console.log("\n--- Demo ---");
console.log(`1. Open Telegram, DM @${me.result.username}`);
console.log('2. Send: "Send 0.01 USDC privately to 0xB214f8D70AB85F2628b8ba684D0C45a1a5bE4763"');
console.log("3. Bot replies with a tappable PearPay card + shielded settlement.");
console.log("\n(Make sure the app is deployed/tunneled at the webhook URL with the SAME .env.)");
