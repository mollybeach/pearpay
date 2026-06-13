import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearFlowStore,
  getFlowSessionByIntent,
  getFlowSessionByTransaction,
  saveFlowSession,
  updateFlowSession,
} from "@/integrations/flow/store";

describe("flow session store", () => {
  beforeEach(() => {
    clearFlowStore();
  });

  afterEach(() => {
    clearFlowStore();
  });

  it("persists and retrieves sessions by intent id", () => {
    saveFlowSession({
      transaction_id: "tx-1",
      session_token: "dct_test",
      intent_id: "intent-1",
      amount: 25,
      recipient: "0x1111111111111111111111111111111111111111",
      checkout_id: "checkout-1",
      created_at: Date.now(),
    });

    const session = getFlowSessionByIntent("intent-1");
    expect(session?.session_token).toBe("dct_test");
    expect(getFlowSessionByTransaction("tx-1")?.intent_id).toBe("intent-1");
  });

  it("updates session status", () => {
    saveFlowSession({
      transaction_id: "tx-2",
      session_token: "dct_2",
      intent_id: "intent-2",
      amount: 10,
      recipient: "0x2222222222222222222222222222222222222222",
      checkout_id: "checkout-2",
      created_at: Date.now(),
    });

    updateFlowSession("intent-2", { status: "completed" });
    expect(getFlowSessionByIntent("intent-2")?.status).toBe("completed");
  });
});
