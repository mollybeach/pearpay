import { describe, expect, it } from "vitest";
import { getFlowClient } from "@/integrations/flow/client";

describe("flow client", () => {
  it("reports unconfigured without env credentials", () => {
    const client = getFlowClient();
    expect(client.configured).toBe(false);
    expect(client.arcChainId).toBe("5042002");
  });
});
