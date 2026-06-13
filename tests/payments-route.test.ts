import { describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/payments/route";

vi.mock("@/core/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/core/payments")>();
  return {
    ...actual,
    processMessage: vi.fn(async (message: string) => {
      if (message === "missing amount") {
        return {
          ok: false,
          summary: "How much should I send?",
          legs: [],
          error: "missing_amount",
        };
      }
      return {
        ok: true,
        summary: "Sent $1 to Molly.",
        legs: [
          {
            recipient: {
              raw: "0x2222222222222222222222222222222222222222",
              hint: "address",
              label: "0x2222…2222",
              address: "0x2222222222222222222222222222222222222222",
              isPearPayUser: true,
              deliveryMode: "instant",
              notificationChannel: "none",
            },
            amount: 1_000_000n,
            outcome: "instant",
            rail: "arc",
            settlementRef: "local_test",
            sourceChainId: 1,
            destinationChainId: 5042002,
            tokenAddress: "0x3600000000000000000000000000000000000000",
            route: "source-to-arc",
            notified: false,
            private: false,
          },
        ],
      };
    }),
  };
});

function request(body: unknown): Request {
  return new Request("http://localhost:3000/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const sender = {
  label: "Molly",
  address: "0x1111111111111111111111111111111111111111",
};

describe("POST /api/payments", () => {
  it("returns a JSON-safe serialized result", async () => {
    const res = await POST(request({ message: "send $1", sender }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.legs[0].amount.baseUnits).toBe("1000000");
    expect(body.legs[0].rail).toBe("arc");
    expect(body.legs[0].destinationChainId).toBe(5042002);
    expect(() => JSON.stringify(body)).not.toThrow();
  });

  it("returns 422 for incomplete payment intents", async () => {
    const res = await POST(request({ message: "missing amount", sender }));
    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({
      error: "missing_amount",
    });
  });

  it("returns 400 for invalid requests", async () => {
    const res = await POST(request({ message: "", sender }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "invalid_request",
    });
  });
});
