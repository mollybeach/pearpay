#!/usr/bin/env node
/**
 * Verify Dynamic integration readiness (env + unit tests).
 * Usage: node scripts/verify-dynamic.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

const envPath = ".env";
const required = [
  "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID",
  "DYNAMIC_ENV_ID",
  "DYNAMIC_API_TOKEN",
];
const agentRequired = ["DYNAMIC_WALLET_PASSWORD"];

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const vars = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    vars[k] = v;
  }
  return vars;
}

const env = loadEnv();
console.log("=== Pear Pay Dynamic Verification ===\n");

let ok = true;
for (const key of required) {
  const present = Boolean(env[key]);
  console.log(`${present ? "✅" : "❌"} ${key}`);
  if (!present) ok = false;
}

console.log("\nAgent server wallet (for x402 demo):");
for (const key of agentRequired) {
  const present = Boolean(env[key]);
  console.log(`${present ? "✅" : "⚠️ "} ${key}`);
}

console.log("\nRunning unit tests…");
try {
  execSync("npm test -- --run tests/flow-store.test.ts tests/x402.test.ts tests/flow-client.test.ts", {
    stdio: "inherit",
  });
} catch {
  ok = false;
}

console.log("\n--- Next steps for LIVE demo ---");
console.log("1. npm run dev");
console.log("2. curl http://localhost:3000/api/flow/status");
console.log("3. POST /api/payments → open payUrl → connect wallet → Pay with Flow");
console.log("4. Homepage → Run Autonomous Agent (needs DYNAMIC_WALLET_PASSWORD)");
console.log("\nSee docs/DYNAMIC_SETUP.md for dashboard checklist.");

process.exit(ok ? 0 : 1);
