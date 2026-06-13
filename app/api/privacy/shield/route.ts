import { NextResponse } from "next/server";
import { z } from "zod";
import { privateTransfer } from "@/integrations/unlink";
import { ARC_TESTNET_CHAIN_ID } from "@/integrations/arc";
import { getEnv } from "@/lib/env";
import { parseUsdc } from "@/lib/money";
import { logger } from "@/lib/logger";

const log = logger.scoped("api:privacy:shield");

const bodySchema = z.object({
  amount: z.number().positive(),
  recipient: z.string().min(1),
  intent_id: z.string().min(1),
  /** Optional explicit sender; defaults to the configured payer. */
  sender: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
});

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const ZERO = "0x0000000000000000000000000000000000000000" as const;

/**
 * POST /api/privacy/shield
 *
 * Routes a payment through Unlink so the amount and counterparty are shielded.
 * Runs a real `transfer()` when Unlink is configured, else a deterministic stub.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { amount, recipient, intent_id, sender } = parsed.data;
  // Resolve the recipient to an address; non-address handles become a
  // deterministic placeholder for the stub path (resolution happens upstream
  // in the orchestrator for real sends).
  const toAddress = (
    ADDR_RE.test(recipient)
      ? recipient
      : `0x${Buffer.from(recipient).toString("hex").padEnd(40, "0").slice(0, 40)}`
  ) as `0x${string}`;

  try {
    const receipt = await privateTransfer({
      fromAddress: (sender ??
        getEnv().AGENT_WALLET_ADDRESS ??
        ZERO) as `0x${string}`,
      toAddress,
      amount: parseUsdc(amount),
      chainId: ARC_TESTNET_CHAIN_ID,
    });

    return NextResponse.json({
      status: receipt.status,
      note_id: receipt.noteId,
      intent_id,
      mode: getEnv().UNLINK_API_KEY ? "live" : "stub",
      estimated_seconds: 3,
    });
  } catch (err) {
    log.error("shield failed", { err: String(err) });
    return NextResponse.json({ error: "shield_failed" }, { status: 502 });
  }
}
