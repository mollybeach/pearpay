import { describe, expect, it } from "vitest";
import {
  ARC_TESTNET_CHAIN_ID,
  ARC_TESTNET_EURC_ADDRESS,
  ARC_USDC_ADDRESS,
  getArcNetworkConfig,
  usdcAddress,
} from "@/integrations/arc";

describe("Arc stablecoin config", () => {
  it("uses Circle's Arc USDC and EURC testnet addresses", () => {
    const config = getArcNetworkConfig();

    expect(config.chainId).toBe(ARC_TESTNET_CHAIN_ID);
    expect(config.stablecoins.USDC).toBe(ARC_USDC_ADDRESS);
    expect(config.stablecoins.EURC).toBe(ARC_TESTNET_EURC_ADDRESS);
    expect(usdcAddress(config.chainId)).toBe(ARC_USDC_ADDRESS);
  });

  it("defaults unknown USDC routes to Arc as the settlement hub", () => {
    expect(usdcAddress(999999)).toBe(ARC_USDC_ADDRESS);
  });

  it("allows deployment env to override Arc stablecoin addresses", () => {
    const config = getArcNetworkConfig({
      NEXT_PUBLIC_ARC_USDC_ADDRESS: "0x1111111111111111111111111111111111111111",
      NEXT_PUBLIC_ARC_EURC_ADDRESS: "0x2222222222222222222222222222222222222222",
    });

    expect(config.stablecoins.USDC).toBe(
      "0x1111111111111111111111111111111111111111",
    );
    expect(config.stablecoins.EURC).toBe(
      "0x2222222222222222222222222222222222222222",
    );
  });
});
