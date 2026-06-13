import { describe, expect, it } from "vitest";
import {
  generateClaimCredentials,
  paymentIdToBytes32,
} from "@/integrations/arc/escrow";
import { encodePacked, keccak256 } from "viem";

describe("Arc escrow helpers", () => {
  it("maps backend payment ids to deterministic bytes32 keys", () => {
    const id = "pay_abc123";
    const bytes32 = paymentIdToBytes32(id);
    expect(bytes32).toMatch(/^0x[a-f0-9]{64}$/);
    expect(paymentIdToBytes32(id)).toBe(bytes32);
  });

  it("generates claim secrets matching Solidity keccak256(abi.encodePacked(secret))", () => {
    const { claimSecret, claimHash } = generateClaimCredentials();
    expect(claimSecret).toMatch(/^0x[a-f0-9]{64}$/);
    expect(claimHash).toBe(
      keccak256(encodePacked(["bytes32"], [claimSecret])),
    );
  });
});
