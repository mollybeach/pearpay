import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { ServerKeyShare, WalletMetadata } from "@dynamic-labs-wallet/node";
import { ThresholdSignatureScheme } from "@dynamic-labs-wallet/core";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.scoped("dynamic:server-wallet");

const WALLET_STORE = path.join(process.cwd(), ".dynamic-agent-wallet.json");

export interface AgentWalletRecord {
  walletMetadata: WalletMetadata;
  externalServerKeyShares: ServerKeyShare[];
  createdAt: number;
}

function loadWalletRecord(): AgentWalletRecord | null {
  if (!existsSync(WALLET_STORE)) return null;
  try {
    return JSON.parse(readFileSync(WALLET_STORE, "utf8")) as AgentWalletRecord;
  } catch {
    return null;
  }
}

function saveWalletRecord(record: AgentWalletRecord): void {
  writeFileSync(WALLET_STORE, JSON.stringify(record, null, 2));
}

function isServerWalletConfigured(): boolean {
  const env = getEnv();
  return Boolean(
    env.DYNAMIC_ENV_ID &&
      env.DYNAMIC_API_TOKEN &&
      env.DYNAMIC_WALLET_PASSWORD,
  );
}

/** Create or load the Pear Pay agent server wallet via Dynamic Node SDK. */
export async function getOrCreateAgentServerWallet(): Promise<AgentWalletRecord | null> {
  const env = getEnv();
  if (env.AGENT_WALLET_ADDRESS) {
    const existing = loadWalletRecord();
    if (existing) return existing;
    return {
      walletMetadata: {
        walletId: "preset",
        accountAddress: env.AGENT_WALLET_ADDRESS,
        chainName: "EVM",
        thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      },
      externalServerKeyShares: [],
      createdAt: Date.now(),
    };
  }

  const existing = loadWalletRecord();
  if (existing) return existing;

  if (!isServerWalletConfigured()) {
    log.debug("server wallet not configured");
    return null;
  }

  try {
    const { DynamicEvmWalletClient } = await import(
      "@dynamic-labs-wallet/node-evm"
    );

    const client = new DynamicEvmWalletClient({
      environmentId: env.DYNAMIC_ENV_ID!,
      enableMPCAccelerator: false,
    });
    await client.authenticateApiToken(env.DYNAMIC_API_TOKEN!);

    const wallet = await client.createWalletAccount({
      thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
      password: env.DYNAMIC_WALLET_PASSWORD!,
      backUpToDynamic: true,
      onError: (error: Error) => {
        log.warn("wallet creation error", { err: String(error) });
      },
    });

    const record: AgentWalletRecord = {
      walletMetadata: wallet.walletMetadata,
      externalServerKeyShares: wallet.externalServerKeyShares,
      createdAt: Date.now(),
    };
    saveWalletRecord(record);
    log.info("agent server wallet created", {
      address: record.walletMetadata.accountAddress,
    });
    return record;
  } catch (err) {
    log.warn("Dynamic server wallet SDK failed", { err: String(err) });
    return null;
  }
}

/** Sign an EIP-191 message with the agent server wallet. */
export async function signAgentMessage(message: string): Promise<{
  signature: `0x${string}`;
  wallet: `0x${string}`;
} | null> {
  const env = getEnv();
  const record = await getOrCreateAgentServerWallet();
  if (!record || !isServerWalletConfigured()) return null;

  try {
    const { DynamicEvmWalletClient } = await import(
      "@dynamic-labs-wallet/node-evm"
    );

    const client = new DynamicEvmWalletClient({
      environmentId: env.DYNAMIC_ENV_ID!,
      enableMPCAccelerator: false,
    });
    await client.authenticateApiToken(env.DYNAMIC_API_TOKEN!);

    const signature = (await client.signMessage({
      message,
      walletMetadata: record.walletMetadata,
      externalServerKeyShares: record.externalServerKeyShares,
      password: env.DYNAMIC_WALLET_PASSWORD!,
    })) as `0x${string}`;

    return {
      signature,
      wallet: record.walletMetadata.accountAddress as `0x${string}`,
    };
  } catch (err) {
    log.warn("agent sign failed", { err: String(err) });
    return null;
  }
}

export { isServerWalletConfigured };
