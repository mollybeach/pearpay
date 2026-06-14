#!/usr/bin/env node
/**
 * Verify the joint private nanopayment flow (Unlink + Circle x402 on Arc).
 *
 * Usage:
 *   npm run verify:nanopay
 *   BASE_URL=https://pearpay.app npm run verify:nanopay
 */
import { execSync } from "node:child_process";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env");
loadEnvFile(".env.local");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

console.log("=== Pear Pay Private Nanopayment Verification ===\n");
console.log(`Target: ${BASE_URL}/api/privacy/nanopay\n`);

let ok = true;

const required = [
  "UNLINK_API_KEY",
  "UNLINK_ENGINE_URL",
  "UNLINK_ACCOUNT_MNEMONIC",
  "X402_CHAIN_NAME",
  "X402_SELLER_ADDRESS",
  "FUNDER_PRIVATE_KEY",
];
for (const key of required) {
  const present = Boolean(process.env[key]);
  console.log(`${present ? "✅" : "❌"} ${key}`);
  if (!present) ok = false;
}

console.log("\nTop up Unlink private pool (if needed)…");
try {
  execSync("npm run fund:unlink-pool", { stdio: "inherit" });
} catch {
  // Non-fatal: the pool may already hold enough shielded USDC for sub-cent
  // nanopayments. The real proof is the POST below succeeding; only flag a
  // genuinely insufficient pool there.
  console.log(
    "⚠️  fund:unlink-pool skipped/failed (funder low on Arc USDC) — relying on existing pool balance",
  );
}

console.log(`\nPOST ${BASE_URL}/api/privacy/nanopay …`);
try {
  const res = await fetch(`${BASE_URL}/api/privacy/nanopay`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount_usd: "0.001" }),
  });
  const body = await res.json();
  if (res.ok && body.ok) {
    console.log("✅ Private nanopayment succeeded");
    console.log(`   burner: ${body.burner}`);
    console.log(`   fundTxId: ${body.fundTxId}`);
    console.log(`   settlementTx: ${body.settlementTx}`);
    console.log(`   payer: ${body.payer}`);
  } else {
    console.log(`❌ ${res.status}:`, body);
    ok = false;
  }
} catch (err) {
  console.log(`❌ Request failed: ${err.message ?? err}`);
  console.log("   Start dev server: npm run dev");
  ok = false;
}

process.exit(ok ? 0 : 1);
