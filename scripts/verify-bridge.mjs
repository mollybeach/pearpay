#!/usr/bin/env node
/**
 * Verify chain-abstracted USDC routing onto Arc via Circle Gateway's unified
 * cross-chain balance (Best Chain Abstracted USDC App Using Arc as a Liquidity
 * Hub).
 *
 * Usage:
 *   npm run verify:bridge                 # config check + read unified balance
 *   EXECUTE_BRIDGE=1 npm run verify:bridge  # ALSO mint USDC onto Arc (spends!)
 *   BASE_URL=https://pearpay.app npm run verify:bridge
 *
 * Env:
 *   SOURCE_CHAIN_ID  default 84532 (Base Sepolia)
 *   BRIDGE_AMOUNT_USD default 0.05
 */
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env");
loadEnvFile(".env.local");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const SOURCE_CHAIN_ID = Number(process.env.SOURCE_CHAIN_ID ?? 84532);
const AMOUNT_USD = process.env.BRIDGE_AMOUNT_USD ?? "0.05";

console.log("=== Pear Pay Chain-Abstracted Bridge Verification ===\n");
console.log(`Target: ${BASE_URL}/api/arc/bridge`);
console.log(`Source chain: ${SOURCE_CHAIN_ID}  ->  Arc Testnet (5042002)\n`);

let ok = true;

const hasKey = Boolean(
  process.env.X402_BUYER_PRIVATE_KEY || process.env.FUNDER_PRIVATE_KEY,
);
console.log(`${hasKey ? "✅" : "❌"} signing key (X402_BUYER_PRIVATE_KEY / FUNDER_PRIVATE_KEY)`);
if (!hasKey) ok = false;

console.log(`\nGET ${BASE_URL}/api/arc/bridge?sourceChainId=${SOURCE_CHAIN_ID} …`);
try {
  const res = await fetch(
    `${BASE_URL}/api/arc/bridge?sourceChainId=${SOURCE_CHAIN_ID}`,
  );
  const body = await res.json();
  if (res.ok && body.configured) {
    console.log("✅ Unified Gateway balance (one liquidity surface):");
    console.log(`   wallet USDC:      ${body.balances?.walletUsdc}`);
    console.log(`   gateway total:    ${body.balances?.gatewayTotal}`);
    console.log(`   gateway available:${body.balances?.gatewayAvailable}`);
  } else {
    console.log(`⚠️  ${res.status}:`, body);
    if (!body.configured) ok = false;
  }
} catch (err) {
  console.log(`❌ Request failed: ${err.message ?? err}`);
  console.log("   Start dev server: npm run dev");
  ok = false;
}

if (process.env.EXECUTE_BRIDGE === "1") {
  console.log(`\nPOST ${BASE_URL}/api/arc/bridge  (minting ${AMOUNT_USD} USDC onto Arc) …`);
  try {
    const res = await fetch(`${BASE_URL}/api/arc/bridge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        amount_usd: AMOUNT_USD,
        source_chain_id: SOURCE_CHAIN_ID,
        deposit_first: process.env.DEPOSIT_FIRST === "1",
      }),
    });
    const body = await res.json();
    if (res.ok && body.ok) {
      console.log("✅ USDC minted onto Arc from the unified cross-chain balance");
      console.log(`   source chain: ${body.sourceChain}`);
      console.log(`   dest chain:   ${body.destinationChain}`);
      console.log(`   mint tx:      ${body.mintTxHash}`);
      console.log(`   explorer:     ${body.explorerUrl}`);
    } else {
      console.log(`❌ ${res.status}:`, body);
      ok = false;
    }
  } catch (err) {
    console.log(`❌ Request failed: ${err.message ?? err}`);
    ok = false;
  }
} else {
  console.log(
    "\nℹ️  Skipping live mint. Re-run with EXECUTE_BRIDGE=1 to mint onto Arc (spends funds).",
  );
}

process.exit(ok ? 0 : 1);
