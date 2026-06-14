import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { parseUsdc } from "@/lib/money";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc/config";
import { getArcSignerAccount } from "@/integrations/arc/client";
import {
  bridgeUsdcToArc,
  getUnifiedBalances,
  gatewayChainName,
  isGatewayBridgeConfigured,
} from "@/integrations/arc/gateway-bridge";

export const runtime = "nodejs";
export const maxDuration = 300;

const log = logger.scoped("api:arc-bridge");

const DEFAULT_SOURCE_CHAIN_ID = 84532; // Base Sepolia

/**
 * Chain-abstracted USDC via Arc as a liquidity hub (Best Chain Abstracted USDC
 * App). GET shows the unified cross-chain Gateway balance; POST mints USDC onto
 * Arc from that unified balance (liquidity pooled across chains, settled on Arc).
 */
export async function GET(request: Request) {
  if (!isGatewayBridgeConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        detail:
          "Set X402_BUYER_PRIVATE_KEY or FUNDER_PRIVATE_KEY to read the unified Gateway balance.",
      },
      { status: 200 },
    );
  }

  const url = new URL(request.url);
  const sourceChainId = Number(
    url.searchParams.get("sourceChainId") ?? DEFAULT_SOURCE_CHAIN_ID,
  );
  if (!gatewayChainName(sourceChainId)) {
    return NextResponse.json(
      { detail: `unsupported Gateway source chain: ${sourceChainId}` },
      { status: 400 },
    );
  }

  try {
    const balances = await getUnifiedBalances(sourceChainId);
    return NextResponse.json({
      configured: true,
      sourceChainId,
      arcChainId: ARC_TESTNET_CHAIN_ID,
      balances,
      note: "Gateway available balance can be minted onto Arc regardless of which chain funded it.",
    });
  } catch (err) {
    log.error("unified balance read failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { detail: "balance read failed", reason: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}

const bodySchema = z.object({
  amount_usd: z.union([z.string(), z.number()]).default("0.05"),
  source_chain_id: z.number().int().positive().default(DEFAULT_SOURCE_CHAIN_ID),
  recipient: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  deposit_first: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!isGatewayBridgeConfigured()) {
    return NextResponse.json(
      { detail: "bridge not configured (X402_BUYER_PRIVATE_KEY / FUNDER_PRIVATE_KEY)" },
      { status: 503 },
    );
  }

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

  if (!gatewayChainName(parsed.data.source_chain_id)) {
    return NextResponse.json(
      { detail: `unsupported Gateway source chain: ${parsed.data.source_chain_id}` },
      { status: 400 },
    );
  }

  // Default recipient: the configured signer's own address on Arc.
  const recipient =
    (parsed.data.recipient as `0x${string}` | undefined) ??
    (getArcSignerAccount().address as `0x${string}`);

  try {
    // Validate amount parses to atomic USDC before spending.
    parseUsdc(parsed.data.amount_usd);
    const result = await bridgeUsdcToArc({
      amountUsd: String(parsed.data.amount_usd),
      recipient,
      sourceChainId: parsed.data.source_chain_id,
      depositFirst: parsed.data.deposit_first,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    log.error("bridge to Arc failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, detail: "bridge failed", reason: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
