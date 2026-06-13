/**
 * Fireblocks Flow HTTP client — checkout payment lifecycle.
 * Handles the Dynamic Flow checkout lifecycle for PearPay.
 */

import { getEnv } from "@/lib/env";

export class FlowError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "FlowError";
  }
}

interface FlowSession {
  transaction_id: string;
  session_token: string;
  intent_id: string;
  amount: number;
  recipient: string;
  checkout_id: string;
  settlement?: Record<string, unknown>;
  status?: string;
}

const sessions = new Map<string, FlowSession>();
const transactions = new Map<string, FlowSession>();

const DYNAMIC_API_BASE = "https://app.dynamicauth.com/api/v0";
const ARC_CHAIN_ID = "5042002";

export class FlowClient {
  private checkoutId: string | undefined;

  private get envId() {
    return getEnv().DYNAMIC_ENV_ID ?? "";
  }

  private get apiToken() {
    return getEnv().DYNAMIC_API_TOKEN ?? "";
  }

  get configured(): boolean {
    return Boolean(this.envId && this.apiToken);
  }

  get arcChainId(): string {
    return ARC_CHAIN_ID;
  }

  private async request(
    method: string,
    path: string,
    options: {
      token?: string;
      session?: string;
      body?: Record<string, unknown>;
    } = {},
  ): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }
    if (options.session) {
      headers["x-dynamic-checkout-session-token"] = options.session;
    }

    const res = await fetch(`${DYNAMIC_API_BASE}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status >= 400) {
      const text = await res.text();
      throw new FlowError(res.status, text);
    }
    if (res.status === 204) return {};
    return (await res.json()) as Record<string, unknown>;
  }

  async ensureCheckout(
    settlementAddress: string,
    usdcAddress: string,
  ): Promise<string> {
    const env = getEnv();
    if (env.DYNAMIC_FLOW_CHECKOUT_ID) {
      this.checkoutId = env.DYNAMIC_FLOW_CHECKOUT_ID;
      return this.checkoutId;
    }
    if (this.checkoutId) return this.checkoutId;

    const checkout = await this.request(
      "POST",
      `/environments/${this.envId}/checkouts`,
      {
        token: this.apiToken,
        body: {
          mode: "payment",
          settlementConfig: {
            strategy: "cheapest",
            settlements: [
              {
                chainName: "EVM",
                chainId: ARC_CHAIN_ID,
                tokenAddress: usdcAddress,
                symbol: "USDC",
                tokenDecimals: 6,
              },
            ],
          },
          destinationConfig: {
            destinations: [
              {
                chainName: "EVM",
                type: "address",
                identifier: settlementAddress,
              },
            ],
          },
        },
      },
    );

    this.checkoutId = checkout.id as string;
    return this.checkoutId;
  }

  async createPayment(params: {
    amount: number;
    recipient: string;
    intentId: string;
    checkoutId: string;
  }): Promise<FlowSession> {
    const result = await this.request(
      "POST",
      `/sdk/${this.envId}/checkouts/${params.checkoutId}/transactions`,
      {
        body: {
          amount: params.amount.toFixed(2),
          currency: "USD",
          memo: {
            intent_id: params.intentId,
            recipient: params.recipient,
          },
          destinationAddresses: [
            { address: params.recipient, chain: "EVM" },
          ],
        },
      },
    );

    const tx = result.transaction as Record<string, unknown>;
    const record: FlowSession = {
      transaction_id: tx.id as string,
      session_token: result.sessionToken as string,
      intent_id: params.intentId,
      amount: params.amount,
      recipient: params.recipient,
      checkout_id: params.checkoutId,
    };
    sessions.set(params.intentId, record);
    transactions.set(record.transaction_id, record);
    return record;
  }

  async attachSource(
    transactionId: string,
    sessionToken: string,
    params: {
      fromAddress: string;
      fromChainId: string;
      fromChainName?: string;
    },
  ): Promise<Record<string, unknown>> {
    return this.request(
      "POST",
      `/sdk/${this.envId}/transactions/${transactionId}/source`,
      {
        session: sessionToken,
        body: {
          sourceType: "wallet",
          fromAddress: params.fromAddress,
          fromChainId: params.fromChainId,
          fromChainName: params.fromChainName ?? "EVM",
        },
      },
    );
  }

  async getQuote(
    transactionId: string,
    sessionToken: string,
    params: { fromTokenAddress: string; slippage?: number },
  ): Promise<Record<string, unknown>> {
    return this.request(
      "POST",
      `/sdk/${this.envId}/transactions/${transactionId}/quote`,
      {
        session: sessionToken,
        body: {
          fromTokenAddress: params.fromTokenAddress,
          slippage: params.slippage ?? 0.01,
        },
      },
    );
  }

  async prepare(
    transactionId: string,
    sessionToken: string,
  ): Promise<Record<string, unknown>> {
    return this.request(
      "POST",
      `/sdk/${this.envId}/transactions/${transactionId}/prepare`,
      {
        session: sessionToken,
        body: {
          assertBalanceForGasCost: true,
          assertBalanceForTransferAmount: true,
        },
      },
    );
  }

  async recordBroadcast(
    transactionId: string,
    sessionToken: string,
    txHash: string,
  ): Promise<Record<string, unknown>> {
    return this.request(
      "POST",
      `/sdk/${this.envId}/transactions/${transactionId}/broadcast`,
      {
        session: sessionToken,
        body: { txHash },
      },
    );
  }

  async getTransaction(transactionId: string): Promise<Record<string, unknown>> {
    return this.request(
      "GET",
      `/sdk/${this.envId}/transactions/${transactionId}`,
    );
  }

  async pollSettlement(
    transactionId: string,
    maxAttempts = 40,
    intervalSec = 3,
  ): Promise<Record<string, unknown>> {
    for (let i = 0; i < maxAttempts; i += 1) {
      const tx = await this.getTransaction(transactionId);
      const settlement = tx.settlementState as string | undefined;
      const execution = tx.executionState as string | undefined;
      if (settlement === "completed") return tx;
      if (
        settlement === "failed" ||
        execution === "failed" ||
        execution === "cancelled" ||
        execution === "expired"
      ) {
        throw new FlowError(
          422,
          `Flow failed: execution=${execution}, settlement=${settlement}`,
        );
      }
      await new Promise((r) => setTimeout(r, intervalSec * 1000));
    }
    throw new FlowError(408, "Settlement polling timed out");
  }

  getSession(intentId: string): FlowSession | undefined {
    return sessions.get(intentId);
  }

  getSessionByTx(transactionId: string): FlowSession | undefined {
    return transactions.get(transactionId);
  }

  markSettled(transactionId: string, data: Record<string, unknown>): void {
    const record = transactions.get(transactionId);
    if (record) {
      record.settlement = data;
      record.status = "completed";
    }
  }
}

let flowClient: FlowClient | null = null;

export function getFlowClient(): FlowClient {
  if (!flowClient) flowClient = new FlowClient();
  return flowClient;
}
