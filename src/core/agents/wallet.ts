import { createAgentWallet } from "@/integrations/dynamic";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const log = logger.scoped("agent-wallet");

export interface AgentAction {
  action: string;
  [key: string]: unknown;
}

let agentWalletAddress: string | null = null;
const agentActions: AgentAction[] = [];

export class AgentWalletService {
  get configured(): boolean {
    const env = getEnv();
    return Boolean(env.DYNAMIC_ENV_ID && env.DYNAMIC_API_TOKEN);
  }

  get address(): string | null {
    const env = getEnv();
    return agentWalletAddress ?? env.AGENT_WALLET_ADDRESS ?? null;
  }

  async initialize(): Promise<Record<string, unknown>> {
    const env = getEnv();

    if (env.AGENT_WALLET_ADDRESS) {
      agentWalletAddress = env.AGENT_WALLET_ADDRESS;
      return { address: env.AGENT_WALLET_ADDRESS, mode: "preset" };
    }

    if (!this.configured) {
      return {
        address: null,
        mode: "stub",
        note: "Set DYNAMIC_ENV_ID + DYNAMIC_API_TOKEN",
      };
    }

    try {
      const wallet = await createAgentWallet("pearpay-demo-agent");
      agentWalletAddress = wallet.address;
      return { address: wallet.address, mode: "created" };
    } catch (err) {
      log.warn("agent wallet init failed", { err: String(err) });
      return { address: null, mode: "error", error: String(err) };
    }
  }

  logAction(action: string, detail: Record<string, unknown>): void {
    agentActions.push({ action, ...detail });
  }

  getActions(): AgentAction[] {
    return agentActions.slice(-20);
  }

  async autonomousX402Pay(
    url: string,
    appBase: string,
  ): Promise<Record<string, unknown>> {
    this.logAction("propose", {
      url,
      reason: "API returned 402 Payment Required",
    });

    const initial = await fetch(url);
    if (initial.status !== 402) {
      const contentType = initial.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await initial.json()
        : await initial.text();
      return { autonomous: false, status: initial.status, body };
    }

    this.logAction("decide", { action: "pay_x402", url });

    const payRes = await fetch(`${appBase}/api/x402/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, amount: 0.001 }),
    });

    let payData: Record<string, unknown>;
    if (payRes.status === 503) {
      payData = { status: "authorized", mode: "agent_stub", amount: 0.001 };
    } else {
      payData = (await payRes.json()) as Record<string, unknown>;
    }

    this.logAction("execute", { payment: payData, wallet: this.address });

    const retry = await fetch(url, {
      headers: { "X-Payment": "pearpay-agent-authorized" },
    });
    const retryContentType = retry.headers.get("content-type") ?? "";
    const apiResponse = retryContentType.includes("application/json")
      ? await retry.json()
      : await retry.text();

    const result = {
      autonomous: true,
      agent_wallet: this.address,
      payment: payData,
      api_status: retry.status,
      api_response: apiResponse,
    };
    this.logAction("complete", result);
    return result;
  }
}

let agentService: AgentWalletService | null = null;

export function getAgentService(): AgentWalletService {
  if (!agentService) agentService = new AgentWalletService();
  return agentService;
}
