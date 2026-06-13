import { handleInbound } from "./handler";
import { createAgentWallet } from "@/integrations/dynamic";
import { resolveAgentEndpoint } from "@/integrations/ens";
import type { OutboundReply } from "./types";

/**
 * AI Agent channel adapter.
 *
 * Powers machine-to-machine commerce: an agent identified by its ENS name uses
 * a Dynamic server wallet to pay for APIs, compute, or other agents. Supports
 * the README's "Pay OpenAI $0.05 for this API request" flow and agent discovery
 * via ENS text records (ENSIP-26).
 */
export interface AgentPaymentRequest {
  /** Paying agent's ENS identity, e.g. "pearpay-agent.eth". */
  agentEns: string;
  /** Natural-language or structured instruction, e.g. "Pay openai.eth $0.05". */
  instruction: string;
}

export async function handleAgentPayment(
  req: AgentPaymentRequest,
): Promise<OutboundReply> {
  // Provision (or look up) the agent's autonomous server wallet.
  const wallet = await createAgentWallet(req.agentEns);

  return handleInbound({
    text: req.instruction,
    sender: { label: req.agentEns, address: wallet.address },
    context: { channel: "agent" },
  });
}

/** Discover another agent's payment endpoint before transacting. */
export async function discoverAgent(agentEns: string) {
  return resolveAgentEndpoint(agentEns);
}
