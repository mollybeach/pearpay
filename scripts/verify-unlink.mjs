#!/usr/bin/env node
/**
 * Verify Unlink integration readiness (env + unit tests + live SDK registration).
 *
 * Usage:
 *   npm run verify:unlink
 *   BASE_URL=https://pearpay.app npm run verify:unlink
 */
import { execSync } from "node:child_process";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env");
loadEnvFile(".env.local");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENGINE_DEFAULT = "https://arc-testnet-production-api.unlink.xyz";

const required = [
  "UNLINK_API_KEY",
  "UNLINK_ENGINE_URL",
  "UNLINK_ACCOUNT_MNEMONIC",
];
const optional = ["UNLINK_ENVIRONMENT", "UNLINK_PROJECT_ID"];

function isHexPrivateKey(value) {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

function isMnemonic(value) {
  const words = value.trim().split(/\s+/);
  return words.length >= 12 && words.length <= 24 && !value.startsWith("0x");
}

console.log("=== Pear Pay Unlink Verification ===\n");

let ok = true;

console.log("Required env:");
for (const key of required) {
  const value = process.env[key];
  const present = Boolean(value);
  console.log(`${present ? "✅" : "❌"} ${key}`);
  if (!present) ok = false;
}

console.log("\nOptional env:");
for (const key of optional) {
  const present = Boolean(process.env[key]);
  console.log(`${present ? "✅" : "⚠️ "} ${key}`);
}

const mnemonic = process.env.UNLINK_ACCOUNT_MNEMONIC ?? "";
if (mnemonic && isHexPrivateKey(mnemonic)) {
  console.log(
    "\n❌ UNLINK_ACCOUNT_MNEMONIC looks like a private key (0x…).",
  );
  console.log("   Run: cast wallet new-mnemonic");
  ok = false;
} else if (mnemonic && !isMnemonic(mnemonic)) {
  console.log("\n⚠️  UNLINK_ACCOUNT_MNEMONIC should be 12–24 space-separated words.");
}

const engine = process.env.UNLINK_ENGINE_URL ?? "";
if (engine && engine !== ENGINE_DEFAULT) {
  console.log(`\n⚠️  UNLINK_ENGINE_URL is custom: ${engine}`);
  console.log(`   Expected for arc-testnet: ${ENGINE_DEFAULT}`);
}

console.log("\nRunning unit tests (stub mode)…");
try {
  execSync("npm test -- --run tests/unlink.test.ts", {
    stdio: "inherit",
    env: {
      ...process.env,
      UNLINK_API_KEY: "",
      UNLINK_ENGINE_URL: "",
      UNLINK_ACCOUNT_MNEMONIC: "",
    },
  });
} catch {
  ok = false;
}

if (ok && process.env.UNLINK_API_KEY && process.env.UNLINK_ENGINE_URL && mnemonic) {
  console.log("\nRegistering live Unlink client…");
  try {
    const { createUnlinkClient, account } = await import(
      "@unlink-xyz/sdk/client"
    );
    const apiKey = process.env.UNLINK_API_KEY;
    const client = createUnlinkClient({
      engineUrl: process.env.UNLINK_ENGINE_URL,
      account: account.fromMnemonic({ mnemonic: mnemonic.trim() }),
      register: async () => {},
      authorizationToken: {
        provider: async () => ({
          token: apiKey,
          expiresAt: new Date(Date.now() + 3_600_000),
        }),
      },
    });
    await client.ensureRegistered();
    const address = await client.getAddress();
    console.log(`✅ Unlink client registered (account: ${address})`);
  } catch (err) {
    console.error("❌ Live Unlink registration failed:", err.message ?? err);
    ok = false;
  }
}

console.log(`\nProbing ${BASE_URL}/api/privacy/shield …`);
try {
  const res = await fetch(`${BASE_URL}/api/privacy/shield`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      amount: 1,
      recipient: "+15555550123",
      intent_id: `verify-${Date.now()}`,
    }),
  });
  const body = await res.json();
  if (res.ok) {
    console.log(`✅ shield API ${res.status}: mode=${body.mode}, status=${body.status}`);
    if (body.mode !== "live" && ok) {
      console.log("⚠️  API returned stub mode — restart dev server after setting .env");
    }
  } else {
    console.log(`❌ shield API ${res.status}:`, body);
    if (BASE_URL.includes("localhost")) ok = false;
  }
} catch {
  console.log(`⚠️  Could not reach ${BASE_URL} (start npm run dev for local probe)`);
}

console.log("\n--- Live judging demo ---");
console.log("1. npm run dev");
console.log('2. /messages → "Send Sasha 50 USDC privately" → 🕶️ shielded card');
console.log("3. curl POST /api/privacy/shield → mode: live");
console.log("4. /prizes → Unlink tab");
console.log("\nSee docs/UNLINK_BOUNTY.md");

process.exit(ok ? 0 : 1);
