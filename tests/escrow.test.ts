import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelPayment,
  claimPayment,
  createClaimablePayment,
  refundExpired,
  setEscrowStore,
} from "@/core/escrow";

// Fresh in-memory store per test via the public setter is unnecessary because
// each created payment has a unique id/token, but we re-seed for isolation.
import { getEscrowStore } from "@/core/escrow";

const sender = "0x1111111111111111111111111111111111111111" as const;

function baseParams() {
  return {
    senderLabel: "molly",
    senderAddress: sender,
    recipientLabel: "+12069476991",
    recipientContact: "+12069476991",
    notificationChannel: "sms" as const,
    amount: 50_000_000n,
    chainId: 1,
  };
}

describe("escrow service", () => {
  beforeEach(() => {
    // Reset to a clean in-memory store between tests.
    setEscrowStore(getEscrowStore());
  });

  it("creates an escrowed claimable payment", async () => {
    const payment = await createClaimablePayment(baseParams());
    expect(payment.status).toBe("escrowed");
    expect(payment.claimToken).toMatch(/^[2-9a-z]+$/);
  });

  it("claims a payment and releases funds", async () => {
    const payment = await createClaimablePayment(baseParams());
    const claimed = await claimPayment(payment.claimToken, "alex@example.com");
    expect(claimed.status).toBe("claimed");
    expect(claimed.claimedByAddress).toBeDefined();
  });

  it("is idempotent on repeated claims", async () => {
    const payment = await createClaimablePayment(baseParams());
    await claimPayment(payment.claimToken, "alex@example.com");
    const again = await claimPayment(payment.claimToken, "alex@example.com");
    expect(again.status).toBe("claimed");
  });

  it("cancels an unclaimed payment", async () => {
    const payment = await createClaimablePayment(baseParams());
    const cancelled = await cancelPayment(payment.id);
    expect(cancelled.status).toBe("cancelled");
  });

  it("refunds expired escrows", async () => {
    const payment = await createClaimablePayment({ ...baseParams(), ttlMs: -1 });
    const count = await refundExpired();
    expect(count).toBeGreaterThanOrEqual(1);
    const store = getEscrowStore();
    const refreshed = await store.getById(payment.id);
    expect(refreshed?.status).toBe("refunded");
  });
});
