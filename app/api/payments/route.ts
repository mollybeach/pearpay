import { NextResponse } from "next/server";
import { z } from "zod";
import { processMessage } from "@/core/payments";
import { logger } from "@/lib/logger";

const log = logger.scoped("api:payments");

const bodySchema = z.object({
  message: z.string().min(1),
  sender: z.object({
    label: z.string().min(1),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    chainId: z.number().int().positive().optional(),
  }),
  channel: z
    .enum([
      "imessage",
      "telegram",
      "discord",
      "slack",
      "whatsapp",
      "sms",
      "voice",
      "agent",
    ])
    .optional(),
});

/**
 * POST /api/payments
 *
 * The single backend endpoint every channel calls. Accepts a natural-language
 * message plus sender context and returns the orchestrated payment result.
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
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { message, sender, channel } = parsed.data;
  try {
    const result = await processMessage(
      message,
      { label: sender.label, address: sender.address as `0x${string}`, chainId: sender.chainId },
      { channel },
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (err) {
    log.error("payment processing failed", { err: String(err) });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
