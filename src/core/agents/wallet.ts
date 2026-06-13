import { createAgentWallet } from "@/integrations/dynamic";
import { signAgentMessage } from "@/integrations/dynamic/server-wallet";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { buildX402Message, encodeX402Payment } from "@/lib/x402";

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
      return {
        address: wallet.address,
        mode: wallet.walletId === "preset" ? "preset" : "dynamic-server",
        wallet_id: wallet.walletId,
      };
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

    const amount = 0.001;
    const payRes = await fetch(`${appBase}/api/x402/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, amount }),
    });

    let payData: Record<string, unknown>;
    if (!payRes.ok) {
      payData = {
        status: "failed",
        mode: "unconfigured",
        detail: await payRes.text(),
      };
      this.logAction("execute", { payment: payData, wallet: this.address });
      return {
        autonomous: false,
        agent_wallet: this.address,
        payment: payData,
        error: "x402 payment not configured",
      };
    }

    payData = (await payRes.json()) as Record<string, unknown>;
    this.logAction("sign", {
      wallet: payData.wallet,
      mode: payData.mode,
    });
    this.logAction("execute", { payment: payData, wallet: this.address });

    const paymentHeader =
      typeof payData.payment_header === "string"
        ? payData.payment_header
        : null;

    if (!paymentHeader) {
      return {
        autonomous: false,
        agent_wallet: this.address,
        payment: payData,
        error: "Missing signed payment header",
      };
    }

    const retry = await fetch(url, {
      headers: { "X-Payment": paymentHeader },
    });
    const retryContentType = retry.headers.get("content-type") ?? "";
    const apiResponse = retryContentType.includes("application/json")
      ? await retry.json()
      : await retry.text();

    const result = {
      autonomous: retry.status === 200,
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

export async function createSignedX402Payment(
  url: string,
  amount: number,
): Promise<Record<string, unknown>> {
  const message = buildX402Message(url, amount);
  const signed = await signAgentMessage(message);

  if (!signed) {
    return {
      status: "unconfigured",
      mode: "stub",
      message: "Set DYNAMIC_ENV_ID, DYNAMIC_API_TOKEN, DYNAMIC_WALLET_PASSWORD",
    };
  }

  const proof = {
    wallet: signed.wallet,
    signature: signed.signature,
    message,
    amount,
    url,
  };

  return {
    status: "authorized",
    mode: "dynamic-server-wallet",
    wallet: signed.wallet,
    signature: signed.signature,
    payment_header: encodeX402Payment(proof),
    message,
  };
}
