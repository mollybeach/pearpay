import { NextResponse } from "next/server";
import { parseUsdc } from "@/lib/money";
import { logger } from "@/lib/logger";
import { isArcEscrowLive } from "@/integrations/arc/client";
import { escrowGatedRelease } from "@/integrations/arc/escrow-gated";
import {
  build402Body,
  buildPaymentRequirements,
  decodePaymentHeader,
  encodePaymentRequired,
  encodePaymentResponse,
  isGatewaySellerConfigured,
  sellerAddress,
  verifyAndSettle,
} from "@/integrations/arc/x402-gateway";

export const runtime = "nodejs";
// settle + on-chain escrow + on-chain claim; allow time for two receipts.
export const maxDuration = 300;

const log = logger.scoped("x402:escrow-gated");

const PRICE_USD = "0.001"; // sub-cent nanopayment
// USDC locked into the conditional escrow as the release vehicle (server funds).
const RELEASE_AMOUNT_USD = "0.001";
const DATASET = {
  dataset: "premium_agent_intelligence",
  tokens: 1024,
  // The "API key" / data that is released only once the on-chain conditional
  // escrow claim confirms (contract-gated, not an EOA receipt).
  api_key: "sk-pearpay-demo-conditional-release",
};

/**
 * x402 nanopayment whose settlement destination is an advanced-logic smart
 * contract (PearPayEscrow), not an EOA. After the gas-free batched x402 settle,
 * the resource is released through an on-chain conditional escrow -> claim
 * cycle. Targets "Best Smart Contracts on Arc with Advanced Logic".
 */
export async function GET(request: Request) {
  const header =
    request.headers.get("x-payment") ?? request.headers.get("payment-signature");

  const gatewayOn = isGatewaySellerConfigured();
  const payTo = sellerAddress();

  // ── No payment yet -> HTTP 402 advertising how to pay ──────────────────────
  if (!header) {
    if (gatewayOn && payTo) {
      const requirements = buildPaymentRequirements({ priceUsd: PRICE_USD, payTo });
      const body = build402Body(requirements, {
        url: request.url,
        description:
          "PearPay premium dataset — released via on-chain conditional escrow on Arc",
      });
      const paymentRequired = encodePaymentRequired(body);
      return NextResponse.json(body, {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": paymentRequired,
          "X-Payment-Required": paymentRequired,
        },
      });
    }
    return NextResponse.json(
      { detail: "Payment Required", accepts: "x402", price: PRICE_USD, currency: "USDC" },
      { status: 402, headers: { "X-Payment-Required": "x402" } },
    );
  }

  // ── Verify + settle the x402 payment (gas-free batched) ────────────────────
  if (!gatewayOn || !payTo) {
    return NextResponse.json(
      { detail: "Gateway seller not configured (X402_SELLER_ADDRESS)" },
      { status: 503 },
    );
  }

  const payload = decodePaymentHeader(header);
  if (!payload) {
    return NextResponse.json({ detail: "Malformed payment header" }, { status: 402 });
  }

  const requirements = buildPaymentRequirements({ priceUsd: PRICE_USD, payTo });
  const { verify, settle } = await verifyAndSettle(payload, requirements);
  if (!verify.isValid) {
    return NextResponse.json(
      { detail: "Invalid payment", reason: verify.invalidReason },
      { status: 402 },
    );
  }
  if (!settle?.success) {
    return NextResponse.json(
      { detail: "Settlement failed", reason: settle?.errorReason },
      { status: 402 },
    );
  }

  // ── Contract-gated conditional release on Arc ──────────────────────────────
  if (!isArcEscrowLive()) {
    // Settlement succeeded but escrow isn't configured: be explicit rather than
    // silently pretending the contract gate ran.
    return NextResponse.json(
      {
        ...DATASET,
        paid_with: "circle-gateway-x402-batched",
        settlement_tx: settle.transaction,
        network: settle.network,
        payer: settle.payer,
        escrow_gated: false,
        escrow_note:
          "Set FUNDER_PRIVATE_KEY + ESCROW_CONTRACT_ADDRESS to release via the on-chain conditional escrow.",
      },
      { headers: { "X-Payment-Response": encodePaymentResponse(settle) } },
    );
  }

  const payer = (settle.payer ?? verify.payer) as `0x${string}` | undefined;
  if (!payer) {
    return NextResponse.json(
      { detail: "Cannot determine payer for conditional release" },
      { status: 502 },
    );
  }

  try {
    const release = await escrowGatedRelease({
      recipient: payer,
      amount: parseUsdc(RELEASE_AMOUNT_USD),
    });
    return NextResponse.json(
      {
        ...DATASET,
        paid_with: "circle-gateway-x402-batched",
        settlement_tx: settle.transaction,
        network: settle.network,
        payer,
        // Proof that the resource destination was an advanced-logic contract.
        escrow_gated: true,
        escrow_contract_payment_id: release.onChainPaymentId,
        escrow_tx: release.escrowTxHash,
        claim_tx: release.claimTxHash,
        arbiter: release.arbiter,
        escrow_explorer_url: release.escrowExplorerUrl,
        claim_explorer_url: release.claimExplorerUrl,
      },
      { headers: { "X-Payment-Response": encodePaymentResponse(settle) } },
    );
  } catch (err) {
    log.error("escrow-gated release failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        detail: "Conditional escrow release failed after settlement",
        reason: err instanceof Error ? err.message : String(err),
        settlement_tx: settle.transaction,
      },
      { status: 502 },
    );
  }
}
