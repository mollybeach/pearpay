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
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  VERCEL_URL: z.string().optional(),
  NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID: z.string().optional(),
  NEXT_PUBLIC_ARC_CHAIN_ID: z.coerce.number().int().positive().default(5042002),
  NEXT_PUBLIC_ARC_RPC_URL: z
    .string()
    .url()
    .default("https://rpc.testnet.arc.network"),
  NEXT_PUBLIC_ARC_USDC_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_ARC_EURC_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_ARC_EXPLORER_URL: z
    .string()
    .url()
    .default("https://testnet.arcscan.app"),

  // WebAuthn / Face ID
  WEBAUTHN_RP_ID: z.string().default("localhost"),
  WEBAUTHN_RP_NAME: z.string().default("PearPay"),
  WEBAUTHN_ORIGIN: z.string().url().default("http://localhost:3000"),
  WEBAUTHN_STORE_PATH: z.string().optional(),

  // Dynamic Flow
  DYNAMIC_FLOW_CHECKOUT_ID: z.string().optional(),
  DYNAMIC_FLOW_WEBHOOK_SECRET: z.string().optional(),
  DYNAMIC_WALLET_PASSWORD: z.string().optional(),
  AGENT_WALLET_ADDRESS: z.string().optional(),
  ARC_USDC_ADDRESS: z.string().optional(),
  ARC_EURC_ADDRESS: z.string().optional(),

  // x402 / Arc funder
  FUNDER_PRIVATE_KEY: z.string().optional(),
  X402_GATEWAY_ADDRESS: z.string().optional(),

  // Blockchain access (viem / wagmi).
  RPC_URL: z.string().url().optional(),
  CHAIN_ID: z.coerce.number().int().positive().default(1),

  // Dynamic — embedded, server, and agent wallets.
  DYNAMIC_ENV_ID: z.string().optional(),
  DYNAMIC_API_TOKEN: z.string().optional(),


  // Arc settlement (Circle) — Circle-native USDC flows.
  ARC_RPC_URL: z.string().url().optional(),
  CIRCLE_API_KEY: z.string().optional(),
  ESCROW_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  ARC_ESCROW_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  ESCROW_DATABASE_URL: z.string().url().optional(),

  // Unlink privacy SDK (private balances + transfers).
  UNLINK_API_KEY: z.string().optional(),
  UNLINK_ENGINE_URL: z.string().url().optional(),
  UNLINK_ENVIRONMENT: z.string().default("arc-testnet"),
  UNLINK_ACCOUNT_MNEMONIC: z.string().optional(),

  // Twilio notification + delivery.
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  TWILIO_WEBHOOK_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Parse and cache environment variables. Throws a readable error if the
 * configuration is invalid.
 */
export function getEnv(): Env {
  if (cached) return cached;

  // Treat blank env vars as unset. Scaffolded `.env` files commonly leave keys
  // present but empty (e.g. `RPC_URL=`); an empty string would otherwise fail
  // strict `.url()` / address validation, whereas omitting the key passes via
  // `.optional()`. Normalizing here makes both behave identically.
  const source: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(process.env)) {
    source[key] = value === "" ? undefined : value;
  }

  const parsed = envSchema.safeParse(source);
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

const PRODUCTION_REQUIRED: Record<string, Array<keyof Env>> = {
  dynamic: ["DYNAMIC_ENV_ID", "DYNAMIC_API_TOKEN", "NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID"],
  arc: ["CIRCLE_API_KEY", "ARC_RPC_URL"],
  unlink: ["UNLINK_API_KEY", "UNLINK_ENGINE_URL", "UNLINK_ACCOUNT_MNEMONIC"],
  twilio: [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_MESSAGING_SERVICE_SID",
    "TWILIO_VERIFY_SERVICE_SID",
    "TWILIO_FROM_NUMBER",
  ],
  webauthn: ["WEBAUTHN_RP_ID", "WEBAUTHN_ORIGIN"],
  contracts: ["ESCROW_CONTRACT_ADDRESS"],
  persistence: ["ESCROW_DATABASE_URL"],
};

export type ProductionIntegration = keyof typeof PRODUCTION_REQUIRED;

export interface ProductionReadinessIssue {
  integration: ProductionIntegration;
  missing: string[];
}

export function getProductionReadiness(
  env: Env = getEnv(),
): ProductionReadinessIssue[] {
  return Object.entries(PRODUCTION_REQUIRED).flatMap(([integration, keys]) => {
    const missing = keys.filter((key) => !env[key]).map(String);
    return missing.length > 0
      ? [{ integration: integration as ProductionIntegration, missing }]
      : [];
  });
}

export function assertConfiguredForProduction(
  integration: ProductionIntegration,
  configured: boolean,
): void {
  const env = getEnv();
  if (configured || env.NODE_ENV !== "production") return;
  const required = (PRODUCTION_REQUIRED[integration] ?? []).map(String).join(", ");
  throw new Error(
    `${integration} is not configured for production. Required env: ${required}`,
  );
}
