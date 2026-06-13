import { logger } from "@/lib/logger";
import { formatUsdc, formatUsdcDisplay, splitEvenly, type UsdcAmount } from "@/lib/money";
import { newPaymentId } from "@/lib/ids";
import { buildPayUrl } from "@/lib/pay-link";
import { parseIntent } from "@/core/nlp";
import type { PaymentIntent } from "@/core/nlp/types";
import { resolveRecipients } from "@/core/recipients";
import type {
  ResolutionContext,
  ResolvedRecipient,
} from "@/core/recipients/types";
import { claimUrl, createClaimablePayment } from "@/core/escrow";
import { sendClaimLink } from "@/integrations/twilio";
import { ARC_TESTNET_CHAIN_ID, ARC_USDC_ADDRESS } from "@/integrations/arc";
import { selectRail, settleOnRail } from "./settlement";
import type { PaymentLeg, PaymentResult, Sender } from "./types";

const log = logger.scoped("orchestrator");

/**
 * Orchestrate a payment from a free-text message. This is the brain referenced
 * in the README: NLP → recipient resolution → routing → settlement → notify.
 */
export async function processMessage(
  message: string,
  sender: Sender,
  ctx: ResolutionContext = {},
): Promise<PaymentResult> {
  const intent = parseIntent(message);
  return processIntent(intent, sender, ctx);
}

/** Orchestrate a payment from an already-parsed intent. */
export async function processIntent(
  intent: PaymentIntent,
  sender: Sender,
  ctx: ResolutionContext = {},
): Promise<PaymentResult> {
  if (intent.type === "unknown") {
    return {
      ok: false,
      summary: "I couldn't tell what payment you wanted to make.",
      legs: [],
      error: "unrecognized_intent",
    };
  }
  if (intent.recipients.length === 0) {
    return {
      ok: false,
      summary: "Who should I send this to?",
      legs: [],
      error: "missing_recipient",
    };
  }
  if (intent.amount === undefined) {
    return {
      ok: false,
      summary: "How much should I send?",
      legs: [],
      error: "missing_amount",
    };
  }

  const recipients = await resolveRecipients(intent.recipients, ctx);

  // For split intents, divide the amount evenly across recipients.
  const amounts =
    intent.type === "split"
      ? splitEvenly(intent.amount, recipients.length)
      : recipients.map(() => intent.amount!);

  const sourceChainId = sender.chainId ?? ARC_TESTNET_CHAIN_ID;
  const legs: PaymentLeg[] = [];

  for (let i = 0; i < recipients.length; i += 1) {
    const recipient = recipients[i]!;
    const amount = amounts[i]!;
    legs.push(
      await processLeg({
        recipient,
        amount,
        sender,
        sourceChainId,
        memo: intent.memo,
        isPrivate: intent.private,
      }),
    );
  }

  const ok = legs.length > 0;
  const payUrl = legs.find((leg) => leg.payUrl)?.payUrl;
  return { ok, summary: summarize(legs, intent.private), legs, payUrl };
}

interface LegParams {
  recipient: ResolvedRecipient;
  amount: UsdcAmount;
  sender: Sender;
  sourceChainId: number;
  memo?: string;
  isPrivate: boolean;
}

async function processLeg(params: LegParams): Promise<PaymentLeg> {
  const { recipient, amount, sender, sourceChainId, memo, isPrivate } = params;

  // Instant settlement: recipient has a wallet/ENS or is a Pear Pay user.
  if (recipient.deliveryMode === "instant" && recipient.address) {
    // Pick the optimal settlement rail (Hedera by default, Arc for Circle-native
    // flows, Unlink for private transfers) and record an HCS audit receipt.
    const rail = selectRail({ amount, isPrivate });
    const settlement = await settleOnRail(rail, {
      fromAddress: sender.address,
      toAddress: recipient.address,
      amount,
      sourceChainId,
      chainId: ARC_TESTNET_CHAIN_ID,
      memo,
    });

    log.info("instant leg settled", { to: recipient.label, rail: settlement.rail });

    const amountDollars = Number(formatUsdc(amount));
    const intentId = newPaymentId();
    const payUrl = buildPayUrl({
      amount: amountDollars,
      recipient: recipient.address,
      intentId,
      recipientLabel: recipient.label,
      recipientType: recipient.contact?.startsWith("+") ? "phone" : "address",
    });

    return {
      recipient,
      amount,
      outcome: "instant",
      rail: settlement.rail,
      txHash: settlement.txHash,
      settlementRef: settlement.ref,
      sourceChainId: settlement.sourceChainId,
      destinationChainId: settlement.destinationChainId,
      tokenAddress: settlement.tokenAddress,
      route: settlement.route,
      notified: false,
      private: isPrivate,
      payUrl,
    };
  }

  // Claimable: escrow funds and deliver a claim link via Twilio.
  const payment = await createClaimablePayment({
    senderLabel: sender.label,
    senderAddress: sender.address,
    recipientLabel: recipient.label,
    recipientContact: recipient.contact,
    notificationChannel: recipient.notificationChannel,
    amount,
    chainId: sourceChainId,
    memo,
    private: isPrivate,
  });

  let notified = false;
  if (
    (recipient.notificationChannel === "sms" ||
      recipient.notificationChannel === "whatsapp") &&
    recipient.contact
  ) {
    const result = await sendClaimLink({
      to: recipient.contact,
      senderLabel: sender.label,
      amountDisplay: formatUsdcDisplay(amount),
      claimUrl: claimUrl(payment.claimToken),
      channel: recipient.notificationChannel,
    });
    notified = result.delivered;
  }

  return {
    recipient,
    amount,
    outcome: "claimable",
    rail: isPrivate ? "unlink" : "arc",
    sourceChainId,
    ...(isPrivate
      ? {}
      : {
          destinationChainId: ARC_TESTNET_CHAIN_ID,
          tokenAddress: ARC_USDC_ADDRESS,
          route:
            sourceChainId === ARC_TESTNET_CHAIN_ID
              ? "arc-native"
              : "source-to-arc",
        }),
    claimUrl: claimUrl(payment.claimToken),
    txHash: payment.escrowTxHash,
    notified,
    private: isPrivate,
  };
}

function summarize(legs: PaymentLeg[], isPrivate: boolean): string {
  const privacy = isPrivate ? " privately" : "";
  const parts = legs.map((leg) => {
    const amount = formatUsdcDisplay(leg.amount);
    if (leg.outcome === "instant") {
      return `Sent ${amount}${privacy} to ${leg.recipient.label}.`;
    }
    return `${amount} is waiting for ${leg.recipient.label} to claim${
      leg.notified ? " — a claim link was sent." : "."
    }`;
  });
  return parts.join(" ");
}
