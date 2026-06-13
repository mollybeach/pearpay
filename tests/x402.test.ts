import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildX402Message,
  decodeX402Payment,
  encodeX402Payment,
  verifyX402Payment,
} from "@/lib/x402";

describe("x402 payment proofs", () => {
  it("round-trips payment encoding", () => {
    const proof = {
      wallet: "0x1111111111111111111111111111111111111111" as const,
      signature: `0x${"ab".repeat(65)}` as `0x${string}`,
      message: buildX402Message("http://localhost:3000/api/x402/premium/data", 0.001),
      amount: 0.001,
      url: "http://localhost:3000/api/x402/premium/data",
    };
    const header = encodeX402Payment(proof);
    const decoded = decodeX402Payment(header);
    expect(decoded?.wallet).toBe(proof.wallet);
    expect(decoded?.message).toBe(proof.message);
  });

  it("verifies signatures from a known wallet", async () => {
    const account = privateKeyToAccount(
      `0x${"11".repeat(32)}` as `0x${string}`,
    );
    const url = "http://localhost:3000/api/x402/premium/data";
    const amount = 0.001;
    const message = buildX402Message(url, amount);
    const signature = await account.signMessage({ message });
    const header = encodeX402Payment({
      wallet: account.address,
      signature,
      message,
      amount,
      url,
    });
    expect(await verifyX402Payment(header)).toBe(true);
  });
});
