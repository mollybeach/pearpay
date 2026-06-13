import { lookupPearPayUser } from "@/integrations/dynamic";
import { logger } from "@/lib/logger";
import type { Sender } from "@/core/payments/types";

const log = logger.scoped("senders");

export type SenderIdentityKind =
  | "phone"
  | "email"
  | "telegram"
  | "discord"
  | "slack"
  | "imessage"
  | "agent";

export interface SenderIdentity {
  kind: SenderIdentityKind;
  value: string;
  label?: string;
}

export interface ResolvedSender extends Sender {
  verified: true;
  userId?: string;
}

function normalizePhone(value: string): string {
  const withoutPrefix = value.replace(/^whatsapp:/i, "");
  const digits = withoutPrefix.replace(/[^\d+]/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export async function resolveSenderWallet(
  identity: SenderIdentity,
): Promise<ResolvedSender | null> {
  const lookupValue =
    identity.kind === "phone" ? normalizePhone(identity.value) : identity.value;
  const user = await lookupPearPayUser(lookupValue);
  if (!user) {
    log.warn("sender wallet unresolved", {
      kind: identity.kind,
      value: lookupValue,
    });
    return null;
  }

  return {
    label: identity.label ?? user.ens ?? lookupValue,
    address: user.address,
    verified: true,
    userId: user.userId,
  };
}
