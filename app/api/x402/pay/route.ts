import { NextResponse } from "next/server";
import { z } from "zod";
import { createSignedX402Payment } from "@/core/agents/wallet";

const bodySchema = z.object({
  url: z.string().url(),
  amount: z.number().positive().default(0.001),
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

  const result = await createSignedX402Payment(
    parsed.data.url,
    parsed.data.amount,
  );

  if (result.mode === "stub" || result.status === "unconfigured") {
    return NextResponse.json(result, { status: 503 });
  }

  return NextResponse.json(result);
}
