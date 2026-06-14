import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getAgentService } from "@/core/agents/wallet";
import { getActiveDelegation } from "@/integrations/dynamic/delegated-wallet";

// Native Dynamic wallet SDK (delegatedSignMessage) -> Node runtime, never Edge.
export const runtime = "nodejs";

const bodySchema = z.object({
  url: z.string().url().optional(),
  wallet_id: z.string().optional(),
});

/**
 * Autonomous agent payment via Dynamic DELEGATED ACCESS.
 *
 * Demonstrates the full delegated loop the agentic bounty rewards: the agent
 * decides to pay an x402 paywall, then signs the payment authorization with the
 * user's delegated MPC wallet (no per-transaction prompt — the bounded
 * authority was granted once at FaceID-time), and the resource is unlocked.
 *
 * Unlike /api/agent/autonomous-pay (which prefers the Circle Gateway buyer
 * key), this route always routes signing through the delegated Dynamic wallet
 * so judges can exercise "delegate from your own wallet" directly.
 */
export async function POST(request: Request) {
  const agent = getAgentService();
  const env = getEnv();
  const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? env.APP_URL).replace(
    /\/$/,
    "",
  );

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const walletId = parsed.data.wallet_id ?? getActiveDelegation()?.walletId;
  if (!walletId) {
    return NextResponse.json(
      {
        detail:
          "No active delegation. The user must approve once via FaceID " +
          "(delegateKeyShares) before the agent can pay autonomously.",
        hint: "POST a wallet.delegation.created webhook to /api/webhooks/dynamic, or complete delegation in the UI.",
      },
      { status: 409 },
    );
  }

  const url = parsed.data.url ?? `${appBase}/api/x402/premium/data`;
  const result = await agent.autonomousX402Pay(url, appBase, { walletId });
  return NextResponse.json({
    ...result,
    signed_via: "dynamic-delegated-wallet",
    wallet_id: walletId,
  });
}
