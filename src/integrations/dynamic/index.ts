import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.scoped("dynamic");

/**
 * Dynamic integration — embedded, server, and agent wallets plus social auth.
 *
 * Dynamic powers onboarding (no seed phrases), instant wallet creation on
 * claim, and server/agent wallets for autonomous transactions. This adapter
 * wraps the Dynamic REST API. Local demos and tests can run without a network,
 * while production fails fast unless real Dynamic credentials are configured.
 */

export interface PearPayUser {
  userId: string;
  address: `0x${string}`;
}

export interface WalletHandle {
  walletId: string;
  address: `0x${string}`;
  /** "embedded" for humans, "server" for agents/autonomous flows. */
  kind: "embedded" | "server";
}

function authHeaders(): Record<string, string> {
  const env = getEnv();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${env.DYNAMIC_API_TOKEN ?? ""}`,
  };
}

function isConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.DYNAMIC_API_TOKEN && env.DYNAMIC_ENV_ID);
}

function requireConfigured() {
  const configured = isConfigured();
  assertConfiguredForProduction("dynamic", configured);
  return configured;
}

/**
 * Look up whether a given identifier (handle, email, phone, address) maps
 * to an existing Pear Pay user with a Dynamic wallet.
 */
export async function lookupPearPayUser(
  identifier: string,
): Promise<PearPayUser | null> {
  if (!requireConfigured()) {
    log.debug("dynamic not configured; treating user as new", { identifier });
    return null;
  }

  const env = getEnv();
  try {
    const res = await fetch(
      `https://app.dynamicauth.com/api/v0/environments/${env.DYNAMIC_ENV_ID}/users/lookup?identifier=${encodeURIComponent(identifier)}`,
      { headers: authHeaders() },
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      log.warn("dynamic user lookup failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as {
      id: string;
      walletAddress: `0x${string}`;
    };
    return { userId: data.id, address: data.walletAddress };
  } catch (err) {
    log.warn("dynamic user lookup error", { err: String(err) });
    return null;
  }
}

/**
 * Create an embedded wallet for a recipient claiming funds. Returns a handle the
 * escrow release flow can deliver to.
 */
export async function createEmbeddedWallet(
  identifier: string,
): Promise<WalletHandle> {
  if (!requireConfigured()) {
    const stub = `0x${Buffer.from(identifier).toString("hex").padEnd(40, "0").slice(0, 40)}` as `0x${string}`;
    log.debug("dynamic stub embedded wallet", { identifier, address: stub });
    return { walletId: `stub_${identifier}`, address: stub, kind: "embedded" };
  }

  const env = getEnv();
  const res = await fetch(
    `https://app.dynamicauth.com/api/v0/environments/${env.DYNAMIC_ENV_ID}/embeddedWallets`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ identifier }),
    },
  );
  if (!res.ok) {
    throw new Error(`Dynamic embedded wallet creation failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    walletId: string;
    address: `0x${string}`;
  };
  return { walletId: data.walletId, address: data.address, kind: "embedded" };
}

/**
 * Provision a server wallet for an AI agent so it can sign and submit
 * transactions autonomously (Best Agentic Build).
 */
export async function createAgentWallet(
  agentId: string,
): Promise<WalletHandle> {
  if (!requireConfigured()) {
    const stub = `0xa6e0${Buffer.from(agentId).toString("hex").padEnd(36, "0").slice(0, 36)}` as `0x${string}`;
    return { walletId: `agent_${agentId}`, address: stub, kind: "server" };
  }

  const env = getEnv();
  const res = await fetch(
    `https://app.dynamicauth.com/api/v0/environments/${env.DYNAMIC_ENV_ID}/serverWallets`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ externalId: agentId }),
    },
  );
  if (!res.ok) {
    throw new Error(`Dynamic agent wallet creation failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    walletId: string;
    address: `0x${string}`;
  };
  return { walletId: data.walletId, address: data.address, kind: "server" };
}
