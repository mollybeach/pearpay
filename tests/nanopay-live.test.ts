import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { describe, expect, it } from "vitest";

/**
 * Debug live private nanopayment / fresh-wallet x402 behavior.
 *
 *   LIVE_NANOPAY=1 npm test -- tests/nanopay-live.test.ts
 */

const LIVE = process.env.LIVE_NANOPAY === "1";

function loadDotEnv(): void {
  const envPath = fileURLToPath(new URL("../.env", import.meta.url));
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1]!;
      const value = m[2]!.replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* no .env */
  }
}

describe.skipIf(!LIVE)("live nanopay debug", () => {
  it(
    "fresh EOA with funder-sent USDC can pay x402",
    async () => {
      loadDotEnv();
      const { resetEnvCache } = await import("@/lib/env");
      const { agentGatewayPay } = await import("@/integrations/arc/x402-gateway");
      const { getArcWalletClient, getArcPublicClient, getArcSignerAccount } = await import(
        "@/integrations/arc/client"
      );
      const { ARC_USDC_ADDRESS } = await import("@/integrations/arc/config");
      const { ERC20_ABI } = await import("@/integrations/arc/abi");
      const { parseUsdc } = await import("@/lib/money");

      resetEnvCache();

      const pk = generatePrivateKey();
      const fresh = privateKeyToAccount(pk);
      const funder = getArcWalletClient();
      const account = getArcSignerAccount();
      const publicClient = getArcPublicClient();
      const amount = parseUsdc("0.02");

      const hash = await funder.writeContract({
        account,
        chain: null,
        address: ARC_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [fresh.address, amount],
      });
      await publicClient.waitForTransactionReceipt({ hash });

      const erc20 = await publicClient.readContract({
        address: ARC_USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [fresh.address],
      });
      const native = await publicClient.getBalance({ address: fresh.address });
      // eslint-disable-next-line no-console
      console.log("fresh wallet", fresh.address, { erc20: erc20.toString(), native: native.toString() });

      const pay = await agentGatewayPay(
        "http://localhost:3000/api/x402/premium/data",
        { privateKey: pk, depositUsd: "0.015" },
      );
      // eslint-disable-next-line no-console
      console.log("fresh wallet pay", pay);
      expect(pay.paid).toBe(true);
    },
    120_000,
  );

  it(
    "unlink-funded burner can pay x402",
    async () => {
      loadDotEnv();
      const { resetEnvCache } = await import("@/lib/env");
      const { resetUnlinkClient } = await import("@/integrations/unlink");
      const { privateNanopayment } = await import("@/integrations/unlink/burner");

      resetEnvCache();
      resetUnlinkClient();

      const res = await privateNanopayment({
        url: "http://localhost:3000/api/x402/premium/data",
        amountUsd: "0.001",
      });
      // eslint-disable-next-line no-console
      console.log("privateNanopayment", res);
      expect(res.ok).toBe(true);
    },
    300_000,
  );
});
