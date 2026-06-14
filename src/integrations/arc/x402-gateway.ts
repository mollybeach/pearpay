import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ARC_TESTNET_CHAIN_ID, ARC_USDC_ADDRESS } from "./config";

const log = logger.scoped("arc:x402-gateway");

/**
 * Real Circle Gateway x402 batched nanopayments (@circle-fin/x402-batching).
 *
 * Two roles:
 *  - SELLER (this app's premium endpoint): build PaymentRequirements, return a
 *    standard x402 `402` with `accepts`, then verify + settle the signed
 *    PaymentPayload via `BatchFacilitatorClient` — gas-free batched settlement
 *    on Arc Testnet.
 *  - BUYER (autonomous agent): `GatewayClient` deposits USDC into the Gateway
 *    once, then `.pay(url)` performs the full 402 -> EIP-3009 sign -> retry
 *    handshake internally.
 *
 * The package is loaded via a runtime dynamic import (variable specifier +
 * webpackIgnore) so the Next.js build and `tsc` stay green even before
 * `npm i @circle-fin/x402-batching @x402/core @x402/evm` is run. Local
 * interfaces below mirror the package's published type declarations (v3.0.4).
 */

// ── Verified constants (Circle Gateway, Arc Testnet) ─────────────────────────
export const X402_VERSION = 2;
export const ARC_NETWORK_ID = `eip155:${ARC_TESTNET_CHAIN_ID}`; // eip155:5042002
/** Circle GatewayWallet (EIP-712 verifyingContract for the batched scheme). */
export const DEFAULT_GATEWAY_WALLET =
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9" as const;

// ── Types mirrored from @circle-fin/x402-batching@3.0.4 ──────────────────────
export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string; // atomic USDC (6 decimals), as string
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export interface PaymentPayload {
  x402Version: number;
  resource?: { url: string; description: string; mimeType: string };
  accepted?: Record<string, unknown>;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

export interface SettleResponse {
  success: boolean;
  errorReason?: string;
  payer?: string;
  transaction: string;
  network: string;
}

// ── Pure helpers (unit-tested; no network) ───────────────────────────────────

/** USD string/number -> atomic USDC units (6 decimals), rounded safely. */
export function usdcAtomic(price: string | number): string {
  const n = typeof price === "number" ? price : parseFloat(price);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`invalid x402 price: ${price}`);
  }
  return Math.round(n * 1_000_000).toString();
}

function gatewayWallet(): string {
  const env = getEnv();
  return env.X402_GATEWAY_ADDRESS || DEFAULT_GATEWAY_WALLET;
}

function usdcAddress(): string {
  const env = getEnv();
  return env.ARC_USDC_ADDRESS || ARC_USDC_ADDRESS;
}

/** Seller (payTo) address — explicit env, else agent/funder-derived later. */
export function sellerAddress(): string | null {
  const env = getEnv();
  return env.X402_SELLER_ADDRESS ?? env.AGENT_WALLET_ADDRESS ?? null;
}

/** Build the x402 PaymentRequirements for a priced resource on Arc Testnet. */
export function buildPaymentRequirements(params: {
  priceUsd: string | number;
  payTo: string;
  maxTimeoutSeconds?: number;
}): PaymentRequirements {
  return {
    scheme: "exact",
    network: ARC_NETWORK_ID,
    asset: usdcAddress(),
    amount: usdcAtomic(params.priceUsd),
    payTo: params.payTo,
    maxTimeoutSeconds: params.maxTimeoutSeconds ?? 60,
    extra: {
      name: "USDC",
      version: "2",
      verifyingContract: gatewayWallet(),
    },
  };
}

/** Standard x402 `402` JSON body advertising accepted payment requirements. */
export function build402Body(
  requirements: PaymentRequirements,
  resource: { url: string; description: string; mimeType?: string },
) {
  return {
    x402Version: X402_VERSION,
    accepts: [requirements],
    error: "payment required",
    resource: {
      url: resource.url,
      description: resource.description,
      mimeType: resource.mimeType ?? "application/json",
    },
  };
}

/** Decode a base64 `X-PAYMENT` / `payment-signature` header into a payload. */
export function decodePaymentHeader(header: string): PaymentPayload | null {
  try {
    const json = Buffer.from(header, "base64").toString("utf8");
    const parsed = JSON.parse(json) as PaymentPayload;
    if (typeof parsed?.x402Version !== "number" || !parsed.payload) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Base64-encode a settle result for the `X-PAYMENT-RESPONSE` header. */
export function encodePaymentResponse(settle: SettleResponse): string {
  return Buffer.from(JSON.stringify(settle), "utf8").toString("base64");
}

/** Seller side is usable once a payTo address exists. */
export function isGatewaySellerConfigured(): boolean {
  return Boolean(sellerAddress());
}

/** Buyer side needs a signing key and the Circle chain-name literal. */
export function isGatewayBuyerConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    (env.X402_BUYER_PRIVATE_KEY || env.FUNDER_PRIVATE_KEY) && env.X402_CHAIN_NAME,
  );
}

// ── Runtime SDK loader (keeps build/tsc green before install) ────────────────
async function loadModule(spec: string): Promise<any> {
  // `spec` is a widened string, so neither tsc nor webpack tries to resolve it.
  return import(/* webpackIgnore: true */ spec);
}

// ── SELLER: verify + settle a received payment (gas-free batched) ────────────
export async function verifyAndSettle(
  payload: PaymentPayload,
  requirements: PaymentRequirements,
): Promise<{ verify: VerifyResponse; settle?: SettleResponse }> {
  const env = getEnv();
  const mod = await loadModule("@circle-fin/x402-batching/server");
  const facilitator = new mod.BatchFacilitatorClient(
    env.X402_FACILITATOR_URL ? { url: env.X402_FACILITATOR_URL } : undefined,
  );

  const verify = (await facilitator.verify(payload, requirements)) as VerifyResponse;
  if (!verify.isValid) {
    log.warn("x402 verify failed", { reason: verify.invalidReason });
    return { verify };
  }

  const settle = (await facilitator.settle(payload, requirements)) as SettleResponse;
  log.info("x402 settled", {
    success: settle.success,
    tx: settle.transaction,
    network: settle.network,
  });
  return { verify, settle };
}

// ── BUYER: autonomous agent pays an x402 resource via Circle Gateway ─────────
export interface AgentPayResult {
  mode: "gateway";
  paid: boolean;
  status: number;
  data?: unknown;
  payTx?: string;
  payer?: string;
  error?: string;
}

export async function agentGatewayPay(
  url: string,
  opts: { depositUsd?: string; privateKey?: string } = {},
): Promise<AgentPayResult> {
  const env = getEnv();
  // An explicit per-call key (e.g. an ephemeral Unlink burner) overrides the
  // configured agent key so privately-funded payments come from an unlinkable
  // identity.
  const privateKey =
    opts.privateKey || env.X402_BUYER_PRIVATE_KEY || env.FUNDER_PRIVATE_KEY;
  const chain = env.X402_CHAIN_NAME;
  if (!privateKey || !chain) {
    return {
      mode: "gateway",
      paid: false,
      status: 0,
      error: "buyer not configured (X402_BUYER_PRIVATE_KEY + X402_CHAIN_NAME)",
    };
  }

  const mod = await loadModule("@circle-fin/x402-batching/client");
  const client = new mod.GatewayClient({
    chain,
    privateKey: privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`,
    rpcUrl: env.ARC_RPC_URL || env.NEXT_PUBLIC_ARC_RPC_URL,
  });

  // One-time top-up so the agent has Gateway balance to spend.
  if (opts.depositUsd) {
    try {
      await client.deposit(opts.depositUsd);
    } catch (err) {
      log.warn("gateway deposit skipped", { err: String(err) });
    }
  }

  // `.pay()` performs the full 402 -> EIP-3009 sign -> retry handshake.
  const res = await client.pay(url);
  return {
    mode: "gateway",
    paid: Boolean(res?.success ?? true),
    status: res?.status ?? 200,
    data: res?.data,
    payTx: res?.payment?.transaction ?? res?.transaction,
    payer: client.address,
  };
}
