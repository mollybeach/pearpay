import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 *
 * Every sponsor SDK reads its credentials from here so that missing or
 * malformed configuration fails fast at boot rather than mid-payment.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Public app URL used to build claim and pay links.
  APP_URL: z.string().url().default("https://pearpay.app"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z.string().optional(),
  NEXT_PUBLIC_ARC_CHAIN_ID: z.coerce.number().int().positive().default(5042002),
  NEXT_PUBLIC_ARC_RPC_URL: z
    .string()
    .url()
    .default("https://rpc.testnet.arc.network"),
  NEXT_PUBLIC_ARC_USDC_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_ARC_EXPLORER_URL: z
    .string()
    .url()
    .default("https://testnet.arcscan.app"),

  // WebAuthn / Face ID
  WEBAUTHN_RP_ID: z.string().default("localhost"),
  WEBAUTHN_RP_NAME: z.string().default("PearPay"),
  WEBAUTHN_ORIGIN: z.string().url().default("http://localhost:3000"),

  // Dynamic Flow
  DYNAMIC_FLOW_CHECKOUT_ID: z.string().optional(),
  DYNAMIC_FLOW_WEBHOOK_SECRET: z.string().optional(),
  DYNAMIC_WALLET_PASSWORD: z.string().optional(),
  AGENT_WALLET_ADDRESS: z.string().optional(),
  ARC_USDC_ADDRESS: z.string().optional(),

  // x402 / Arc funder
  FUNDER_PRIVATE_KEY: z.string().optional(),
  X402_GATEWAY_ADDRESS: z.string().optional(),

  // Blockchain access (viem / wagmi).
  RPC_URL: z.string().url().optional(),
  CHAIN_ID: z.coerce.number().int().positive().default(1),

  // Dynamic — embedded, server, and agent wallets.
  DYNAMIC_ENV_ID: z.string().optional(),
  DYNAMIC_API_TOKEN: z.string().optional(),

  // ENS resolution.
  ENS_RPC_URL: z.string().url().optional(),

  // Hedera — primary settlement rail (HTS token, HBAR gas, HCS audit log).
  HEDERA_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
  HEDERA_OPERATOR_ID: z.string().optional(),
  HEDERA_OPERATOR_KEY: z.string().optional(),
  HEDERA_USDC_TOKEN_ID: z.string().optional(),
  HEDERA_HCS_TOPIC_ID: z.string().optional(),

  // Arc settlement (Circle) — Circle-native USDC flows.
  ARC_RPC_URL: z.string().url().optional(),
  CIRCLE_API_KEY: z.string().optional(),

  // Unlink privacy SDK.
  UNLINK_API_KEY: z.string().optional(),

  // Twilio notification + delivery.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Parse and cache environment variables. Throws a readable error if the
 * configuration is invalid.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

/** Test-only helper to reset the cached env between runs. */
export function resetEnvCache(): void {
  cached = null;
}
