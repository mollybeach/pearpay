#!/usr/bin/env node
/**
 * Create a Dynamic embedded/server MPC wallet (headless) via the Node SDK.
 *
 * Grounded in https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview
 *   client.authenticateApiToken(token) -> client.createWalletAccount({ scheme, password, backUpToDynamic })
 *
 * Run on your own machine (the native MPC addon can't load in the build sandbox):
 *   node scripts/create-wallet.mjs
 *
 * Requires in .env: DYNAMIC_ENV_ID, DYNAMIC_API_TOKEN, DYNAMIC_WALLET_PASSWORD
 * Dashboard prerequisite: enable "multiple embedded wallets per chain"
 *   (app.dynamic.xyz/dashboard/embedded-wallets/dynamic)
 *
 * On success it prints the new address and persists the wallet to
 * `.dynamic-agent-wallet.json` so the app reuses it as the agent wallet.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile(".env");

const ENV_ID = process.env.DYNAMIC_ENV_ID;
const API_TOKEN = process.env.DYNAMIC_API_TOKEN;
const PASSWORD = process.env.DYNAMIC_WALLET_PASSWORD;

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!ENV_ID) fail("DYNAMIC_ENV_ID is not set in .env");
if (!API_TOKEN) fail("DYNAMIC_API_TOKEN is not set in .env");
if (!PASSWORD) fail("DYNAMIC_WALLET_PASSWORD is not set in .env");

const main = async () => {
  console.log("→ Creating Dynamic EVM MPC wallet…");
  const { DynamicEvmWalletClient } = await import(
    "@dynamic-labs-wallet/node-evm"
  );
  const { ThresholdSignatureScheme } = await import(
    "@dynamic-labs-wallet/core"
  );

  const client = new DynamicEvmWalletClient({
    environmentId: ENV_ID,
    enableMPCAccelerator: false,
  });
  await client.authenticateApiToken(API_TOKEN);

  const wallet = await client.createWalletAccount({
    thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
    password: PASSWORD,
    backUpToDynamic: true,
    onError: (e) => console.error("  wallet error:", e?.message ?? e),
  });

  const record = {
    walletMetadata: wallet.walletMetadata,
    externalServerKeyShares: wallet.externalServerKeyShares,
    createdAt: Date.now(),
  };
  const out = resolve(process.cwd(), ".dynamic-agent-wallet.json");
  writeFileSync(out, JSON.stringify(record, null, 2));

  const address = wallet.walletMetadata?.accountAddress;
  console.log(`\n✅ Wallet created: ${address}`);
  console.log(`   Persisted to ${out} (the app reuses this as the agent wallet).`);
  console.log(
    `\n   Tip: set AGENT_WALLET_ADDRESS=${address} in .env to pin it,`,
  );
  console.log(`   and fund it with Arc testnet USDC at https://faucet.circle.com`);
};

main().catch((err) => {
  console.error("\n❌ Wallet creation failed:", err?.message ?? err);
  console.error(
    "   Check: API token has wallet scope, and 'multiple embedded wallets per chain' is enabled in the dashboard.",
  );
  process.exit(1);
});
