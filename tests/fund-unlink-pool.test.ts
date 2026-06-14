import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * One-time (or top-up) shield of public USDC into the Unlink private balance
 * so `/api/privacy/nanopay` can withdraw to ephemeral burners.
 *
 *   npm run fund:unlink-pool
 */

const FUND = process.env.FUND_UNLINK === "1";

function loadDotEnv(): void {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  let raw: string;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1]!;
    const value = m[2]!.replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

describe.skipIf(!FUND)("fund unlink private pool", () => {
  it(
    "deposits USDC from funder into shielded balance",
    async () => {
      loadDotEnv();
      const { resetEnvCache } = await import("@/lib/env");
      const { resetUnlinkClient, deposit } = await import(
        "@/integrations/unlink"
      );
      const { getArcSignerAccount } = await import("@/integrations/arc/client");
      const { ARC_TESTNET_CHAIN_ID } = await import(
        "@/integrations/arc/config"
      );
      const { parseUsdc } = await import("@/lib/money");

      resetEnvCache();
      resetUnlinkClient();

      const addr = getArcSignerAccount().address;
      const amountUsd = process.env.FUND_UNLINK_USD ?? "0.10";
      const res = await deposit(addr, parseUsdc(amountUsd), ARC_TESTNET_CHAIN_ID);
      expect(res.noteId).toBeTruthy();
      // eslint-disable-next-line no-console
      console.log(`Shielded ${amountUsd} USDC into Unlink pool (tx: ${res.noteId})`);
    },
    300_000,
  );
});
