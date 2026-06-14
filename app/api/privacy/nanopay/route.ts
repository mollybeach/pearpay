import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { privateNanopayment } from "@/integrations/unlink/burner";

export const runtime = "nodejs";
// The flow does an on-chain balance poll + Gateway deposit + settle; allow time.
// (Effective on Vercel Pro; Hobby caps at 60s — run the proof locally if it times out.)
export const maxDuration = 300;

const bodySchema = z.object({
  // Optional — defaults to THIS deployment's own paywalled resource. A hardcoded
  // localhost default fails on Vercel (the function can't fetch localhost:3000).
  url: z.string().url().optional(),
  amount_usd: z.union([z.string(), z.number()]).default("0.001"),
});

/** This deployment's public base URL, for self-referential server-side fetches. */
function selfBaseUrl(request: Request): string {
  const env = getEnv();
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? env.APP_URL;
  const base = fromEnv && !fromEnv.includes("localhost")
    ? fromEnv
    : new URL(request.url).origin;
  return base.replace(/\/$/, "");
}

/**
 * Joint Private Nanopayment (Dynamic + Unlink + Arc):
 *   shielded pool -> ephemeral burner -> gas-free x402 settlement on Arc.
 * The response never exposes the burner's private key.
 */
export async function POST(request: Request) {
  const env = getEnv();

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

  const url =
    parsed.data.url ?? `${selfBaseUrl(request)}/api/x402/premium/data`;

  const result = await privateNanopayment({
    url,
    amountUsd: parsed.data.amount_usd,
    chainId: env.NEXT_PUBLIC_ARC_CHAIN_ID,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
