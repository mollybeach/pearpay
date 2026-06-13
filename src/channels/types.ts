import type { ResolutionContext } from "@/core/recipients/types";
import type { Sender } from "@/core/payments/types";

/**
 * A normalized inbound message from any channel. Each channel adapter maps its
 * native webhook/event payload into this shape before handing it to the shared
 * orchestrator, so all channels behave identically.
 */
export interface InboundMessage {
  text: string;
  sender: Sender;
  context: ResolutionContext;
}

/** A normalized reply a channel adapter sends back to the user. */
export interface OutboundReply {
  text: string;
}
