import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  amount: z.number().positive(),
  recipient: z.string().min(1),
  intent_id: z.string().min(1),
});

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

  return NextResponse.json({
    status: "shielding",
    amount: parsed.data.amount,
    recipient: parsed.data.recipient,
    intent_id: parsed.data.intent_id,
    mode: "stub",
    estimated_seconds: 3,
  });
}
