import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";

/**
 * Live Arc testnet verification — drives the REAL app code paths
 * (`escrowOnChain` → `claimOnChain`) against the deployed PearPayEscrow
 * contract on Arc testnet, proving the claimable-payment rail end-to-end.
 *
 * Skipped by default. To run a real on-chain payment (spends ~0.01 testnet
 * USDC from FUNDER_PRIVATE_KEY):
 *
 *   LIVE_ARC=1 /opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs \
 *     run tests/arc-live.test.ts
 *
 * Requires FUNDER_PRIVATE_KEY, ARC_ESCROW_CONTRACT_ADDRESS (or
 * ESCROW_CONTRACT_ADDRESS), and ARC_RPC_URL in .env.
 */

const LIVE = process.env.LIVE_ARC === "1";

// Load .env into process.env before any getEnv() call so the live Arc clients
// pick up FUNDER_PRIVATE_KEY / contract address. Vitest does not auto-load it.
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

describe.skipIf(!LIVE)("Arc testnet live escrow + claim", () => {
  beforeAll(async () => {
    loadDotEnv();
    const { resetEnvCache } = await import("@/lib/env");
    resetEnvCache();
  });

  it(
    "escrows USDC on-chain and releases it to a fresh recipient",
    async () => {
      const { escrowOnChain, claimOnChain, isArcEscrowLive } = await import(
        "@/integrations/arc/escrow"
      );
      const { getArcPublicClient } = await import("@/integrations/arc/client");
      const { PEARPAY_ESCROW_ABI, ERC20_ABI } = await import(
        "@/integrations/arc/abi"
      );
      const { getEscrowContractAddress } = await import(
        "@/integrations/arc/client"
      );
      const { ARC_USDC_ADDRESS } = await import("@/integrations/arc/config");
      const { parseUsdc } = await import("@/lib/money");

      expect(isArcEscrowLive(), "Arc escrow must be configured").toBe(true);

      const publicClient = getArcPublicClient();
      const contract = getEscrowContractAddress()!;
      const amount = parseUsdc("0.01");
      const paymentId = `pay_live_${Date.now()}`;
      const recipient = privateKeyToAccount(
        `0x${randomBytes(32).toString("hex")}`,
      ).address;

      // --- escrow() ---
      const escrow = await escrowOnChain({
        paymentId,
        amount,
        expiresAtMs: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      expect(escrow.escrowTxHash).toMatch(/^0x[a-f0-9]{64}$/);
      // eslint-disable-next-line no-console
      console.log("escrow() tx:", escrow.explorerUrl);

      const escrowStatus = await publicClient.readContract({
        address: contract,
        abi: PEARPAY_ESCROW_ABI,
        functionName: "statusOf",
        args: [escrow.onChainPaymentId],
      });
      expect(escrowStatus).toBe(1); // Status.Escrowed

      const recipientBefore = await publicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [recipient],
      });

      // --- claim() ---
      const claim = await claimOnChain({
        onChainPaymentId: escrow.onChainPaymentId,
        claimSecret: escrow.claimSecret,
        recipient,
      });
      expect(claim.claimTxHash).toMatch(/^0x[a-f0-9]{64}$/);
      // eslint-disable-next-line no-console
      console.log("claim() tx:", claim.explorerUrl);

      const claimStatus = await publicClient.readContract({
        address: contract,
        abi: PEARPAY_ESCROW_ABI,
        functionName: "statusOf",
        args: [escrow.onChainPaymentId],
      });
      expect(claimStatus).toBe(2); // Status.Claimed

      const recipientAfter = await publicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [recipient],
      });
      expect(recipientAfter - recipientBefore).toBe(amount);
    },
    180_000,
  );
});
