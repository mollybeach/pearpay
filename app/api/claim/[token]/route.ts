import { NextResponse } from "next/server";
import { z } from "zod";
import { claimPayment } from "@/core/escrow";
import { getEscrowStore } from "@/core/escrow";
import { formatUsdcDisplay } from "@/lib/money";
import { logger } from "@/lib/logger";

const log = logger.scoped("api:claim");

/** GET /api/claim/:token — fetch claim details for the claim page. */
export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const payment = await getEscrowStore().getByToken(params.token);
  if (!payment) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    senderLabel: payment.senderLabel,
    amountDisplay: payment.private ? "a private amount" : formatUsdcDisplay(payment.amount),
    memo: payment.memo,
    status: payment.status,
    expiresAt: payment.expiresAt,
    private: payment.private,
  });
}

const claimSchema = z.object({
  recipientIdentifier: z.string().min(1),
});

/** POST /api/claim/:token — claim funds, creating an embedded wallet. */
export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const released = await claimPayment(
      params.token,
      parsed.data.recipientIdentifier,
    );
    return NextResponse.json({
      status: released.status,
      address: released.claimedByAddress,
    });
  } catch (err) {
    log.warn("claim failed", { token: params.token, err: String(err) });
    return NextResponse.json(
      { error: "claim_failed", message: String(err) },
      { status: 409 },
    );
  }
}
