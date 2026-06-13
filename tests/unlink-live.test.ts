import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Live Unlink verification — drives the REAL private rail (`privateTransfer`,
 * which shields via deposit then withdraws through the pool) against the live
 * Unlink engine on Arc testnet, proving funds reach the recipient unlinkably.
 *
 * Skipped by default. To run a real shielded payment (spends ~0.03 testnet
 * USDC from FUNDER_PRIVATE_KEY through the Unlink pool):
 *
 *   LIVE_UNLINK=1 /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs \
 *     run tests/unlink-live.test.ts
 *
 * Requires UNLINK_API_KEY, UNLINK_ENGINE_URL, UNLINK_ACCOUNT_MNEMONIC, and
 * FUNDER_PRIVATE_KEY (the EVM wallet that funds the shielded deposit) in .env.
 */

const LIVE = process.env.LIVE_UNLINK === "1";

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

describe.skipIf(!LIVE)("Unlink live private transfer", () => {
  beforeAll(async () => {
    loadDotEnv();
    const { resetEnvCache } = await import("@/lib/env");
    const { resetUnlinkClient } = await import("@/integrations/unlink");
    resetEnvCache();
    resetUnlinkClient();
  });

  it(
    "shields USDC and delivers it to a fresh recipient through the pool",
    async () => {
      const { privateTransfer } = await import("@/integrations/unlink");
      const { getArcPublicClient } = await import("@/integrations/arc/client");
      const { ARC_USDC_ADDRESS, ARC_TESTNET_CHAIN_ID } = await import(
        "@/integrations/arc/config"
      );
      const { ERC20_ABI } = await import("@/integrations/arc/abi");
      const { parseUsdc } = await import("@/lib/money");

      const publicClient = getArcPublicClient();
      const amount = parseUsdc("0.03");
      const fromAddress = privateKeyToAccount(
        `0x${randomBytes(32).toString("hex")}`,
      ).address;
      const recipient = privateKeyToAccount(
        `0x${randomBytes(32).toString("hex")}`,
      ).address;

      const before = await publicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [recipient],
      });

      const receipt = await privateTransfer({
        fromAddress,
        toAddress: recipient,
        amount,
        chainId: ARC_TESTNET_CHAIN_ID,
      });
      expect(receipt.status).toBe("settled");
      expect(receipt.noteId).toMatch(/^0x[0-9a-f]{64}$/);
      // eslint-disable-next-line no-console
      console.log("private withdraw tx:", receipt.noteId, "→", recipient);

      const after = await publicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [recipient],
      });
      expect(after - before).toBe(amount);
    },
    300_000,
  );
});
