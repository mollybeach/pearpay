import { describe, expect, it } from "vitest";
import {
  GATEWAY_TESTNET_DOMAINS,
  gatewayChainName,
} from "@/integrations/arc/gateway-bridge";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc/config";

describe("Gateway cross-chain bridge helpers", () => {
  it("maps EVM chain ids to Circle Gateway chain-name literals", () => {
    expect(gatewayChainName(84532)).toBe("baseSepolia");
    expect(gatewayChainName(11155111)).toBe("sepolia");
    expect(gatewayChainName(421614)).toBe("arbitrumSepolia");
    expect(gatewayChainName(ARC_TESTNET_CHAIN_ID)).toBe("arcTestnet");
  });

  it("returns null for chains Circle Gateway does not support", () => {
    expect(gatewayChainName(1234567)).toBeNull();
  });

  it("uses the SDK-verified Arc Gateway domain (26)", () => {
    // Matches @circle-fin/x402-batching GATEWAY_DOMAINS.arcTestnet.
    expect(GATEWAY_TESTNET_DOMAINS.arcTestnet).toBe(26);
    expect(GATEWAY_TESTNET_DOMAINS.baseSepolia).toBe(6);
    expect(GATEWAY_TESTNET_DOMAINS.sepolia).toBe(0);
  });
});
