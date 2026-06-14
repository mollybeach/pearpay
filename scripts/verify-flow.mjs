#!/usr/bin/env node
/**
 * Smoke-test Dynamic Flow API routes (status → start → source → quote).
 *
 * Usage:
 *   npm run dev   # in another terminal
 *   npm run verify:flow
 *   BASE_URL=https://pearpay.app npm run verify:flow
 */
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env");
loadEnvFile(".env.local");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ARC_USDC =
  process.env.ARC_USDC_ADDRESS ??
  process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000";
// Source for the smoke test must be a TESTNET chain so Flow can route into the
// Arc testnet settlement (a mainnet source can't bridge to a testnet target).
// Base Sepolia (84532) USDC is a Flow-supported testnet source.
const SOURCE_CHAIN_ID = process.env.FLOW_TEST_SOURCE_CHAIN_ID ?? "84532";
const SOURCE_USDC =
  process.env.FLOW_TEST_SOURCE_USDC ??
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const TEST_RECIPIENT =
  process.env.AGENT_WALLET_ADDRESS ??
  "0xB214476310000000000000000000000000004763";
const TEST_PAYER =
  process.env.FUNDER_ADDRESS ?? "0xB214f8D70AB85F2628b8ba684D0C45a1a5bE4763";

const requiredEnv = [
  "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
  "DYNAMIC_ENV_ID",
  "DYNAMIC_API_TOKEN",
];

function log(step, ok, detail = "") {
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ""}`);
}

async function fetchJson(path, init) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log("=== Pear Pay Flow Verification ===\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  let passed = true;

  console.log("Env:");
  for (const key of requiredEnv) {
    const present = Boolean(process.env[key]);
    log(key, present);
    if (!present) passed = false;
  }

  console.log("\nStep 1 — GET /api/flow/status");
  let statusRes;
  try {
    statusRes = await fetchJson("/api/flow/status");
  } catch (err) {
    log(
      "Reach dev server",
      false,
      err instanceof Error ? err.message : String(err),
    );
    console.log("\nStart the app: npm run dev");
    process.exit(1);
  }

  if (!statusRes.ok) {
    log("GET /api/flow/status", false, `HTTP ${statusRes.status}`);
    process.exit(1);
  }

  const configured = Boolean(statusRes.body?.configured);
  log("Flow configured", configured);
  if (!configured) {
    console.log("\nSet Dynamic env vars — see docs/DYNAMIC_SETUP.md");
    process.exit(1);
  }

  const intentId = `verify-flow-${Date.now()}`;

  console.log("\nStep 2 — POST /api/flow/payment/start");
  const startRes = await fetchJson("/api/flow/payment/start", {
    method: "POST",
    body: JSON.stringify({
      intent_id: intentId,
      amount: 1.0,
      recipient: TEST_RECIPIENT,
    }),
  });

  if (!startRes.ok) {
    log("POST start", false, JSON.stringify(startRes.body));
    process.exit(1);
  }

  const { transaction_id: transactionId, session_token: sessionToken } =
    startRes.body ?? {};
  log(
    "POST start",
    Boolean(transactionId && sessionToken),
    transactionId ? `tx ${transactionId}` : "missing transaction_id",
  );
  if (!transactionId || !sessionToken) {
    process.exit(1);
  }

  console.log("\nStep 3 — POST /api/flow/payment/source");
  const sourceRes = await fetchJson("/api/flow/payment/source", {
    method: "POST",
    body: JSON.stringify({
      intent_id: intentId,
      from_address: TEST_PAYER,
      from_chain_id: SOURCE_CHAIN_ID,
      from_chain_name: "EVM",
    }),
  });

  if (!sourceRes.ok) {
    log("POST source", false, JSON.stringify(sourceRes.body));
    passed = false;
  } else {
    log("POST source", true, sourceRes.body?.execution_state ?? "attached");
  }

  console.log("\nStep 4 — POST /api/flow/payment/quote");
  const quoteRes = await fetchJson("/api/flow/payment/quote", {
    method: "POST",
    body: JSON.stringify({
      intent_id: intentId,
      from_token_address: SOURCE_USDC,
      slippage: 0.01,
    }),
  });

  if (!quoteRes.ok) {
    const detail = JSON.stringify(quoteRes.body);
    log("POST quote", false, detail);
    if (detail.includes("unknown")) {
      console.log(
        "\n⚠️  No route for this source → settlement pair. Use a TESTNET source",
      );
      console.log(
        `   that Flow can bridge to Arc testnet (default: Base Sepolia ${SOURCE_CHAIN_ID}).`,
      );
      console.log(
        "   A mainnet source (e.g. chain 8453) cannot route to a testnet settlement.",
      );
    }
    passed = false;
  } else {
    const toAmount = quoteRes.body?.to_amount;
    log("POST quote", true, toAmount ? `to_amount ${toAmount}` : "quoted");
  }

  console.log("\n--- Summary ---");
  if (passed) {
    console.log("Flow smoke test passed (status → start → source → quote).");
    console.log(`Arc USDC: ${ARC_USDC}`);
    process.exit(0);
  }

  console.log("Flow smoke test failed — see steps above.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
