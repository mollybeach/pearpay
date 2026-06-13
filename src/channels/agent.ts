import { handleInbound } from "./handler";
import { createAgentWallet } from "@/integrations/dynamic";
import type { OutboundReply } from "./types";

/**
 * AI Agent channel adapter.
 *
 * Powers machine-to-machine commerce: an agent uses a Dynamic server wallet to
 * pay for APIs, compute, or other agents — the README's "Pay OpenAI $0.05 for
 * this API request" flow, with no human in the loop.
 */
export interface AgentPaymentRequest {
  /** Paying agent's identifier. */
  agentId: string;
  /** Natural-language or structured instruction, e.g. "Pay 0x… $0.05". */
  instruction: string;
}

export async function handleAgentPayment(
  req: AgentPaymentRequest,
): Promise<OutboundReply> {
  // Provision (or look up) the agent's autonomous server wallet.
  const wallet = await createAgentWallet(req.agentId);

  return handleInbound({
    text: req.instruction,
    sender: { label: req.agentId, address: wallet.address },
    context: { channel: "agent" },
  });
}
