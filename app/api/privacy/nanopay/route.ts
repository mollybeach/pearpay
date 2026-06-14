import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { privateNanopayment } from "@/integrations/unlink/burner";

export const runtime = "nodejs";

const bodySchema = z.object({
  url: z.string().url().default("http://localhost:3000/api/x402/premium/data"),
  amount_usd: z.union([z.string(), z.number()]).default("0.001"),
});

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

  const result = await privateNanopayment({
    url: parsed.data.url,
    amountUsd: parsed.data.amount_usd,
    chainId: env.NEXT_PUBLIC_ARC_CHAIN_ID,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
