import { createPublicClient, http, isAddress, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.scoped("ens");

let client: PublicClient | null = null;

function ensClient(): PublicClient {
  if (client) return client;
  const env = getEnv();
  client = createPublicClient({
    chain: mainnet,
    transport: http(env.ENS_RPC_URL ?? env.RPC_URL),
  });
  return client;
}

export interface EnsResolution {
  name: string;
  address?: `0x${string}`;
}

/**
 * Resolve an ENS name to an address (forward resolution). Returns null when the
 * name is invalid or has no address record.
 */
export async function resolveEns(name: string): Promise<EnsResolution | null> {
  if (!/\.eth$/i.test(name)) return null;
  try {
    const normalized = normalize(name);
    const address = await ensClient().getEnsAddress({ name: normalized });
    return { name: normalized, address: address ?? undefined };
  } catch (err) {
    log.warn("ens forward resolution failed", { name, err: String(err) });
    return null;
  }
}

/** Reverse-resolve an address to its primary ENS name, if any. */
export async function reverseResolve(
  address: `0x${string}`,
): Promise<string | null> {
  if (!isAddress(address)) return null;
  try {
    return await ensClient().getEnsName({ address });
  } catch (err) {
    log.warn("ens reverse resolution failed", { address, err: String(err) });
    return null;
  }
}

/**
 * Read an ENS text record. Used for agent metadata and payment endpoints per
 * ENSIP-26 (e.g. `agent.payment`, `com.twitter`, `url`).
 */
export async function getTextRecord(
  name: string,
  key: string,
): Promise<string | null> {
  try {
    const normalized = normalize(name);
    return await ensClient().getEnsText({ name: normalized, key });
  } catch (err) {
    log.warn("ens text record read failed", { name, key, err: String(err) });
    return null;
  }
}

/**
 * Resolve an AI agent's payment endpoint from its ENS identity. Agents publish
 * a `pearpay.endpoint` text record (ENSIP-26) other agents can discover.
 */
export async function resolveAgentEndpoint(
  agentEns: string,
): Promise<{ ens: string; address?: `0x${string}`; endpoint?: string } | null> {
  const resolution = await resolveEns(agentEns);
  if (!resolution) return null;
  const endpoint =
    (await getTextRecord(agentEns, "pearpay.endpoint")) ??
    (await getTextRecord(agentEns, "url")) ??
    undefined;
  return {
    ens: resolution.name,
    address: resolution.address,
    endpoint,
  };
}
