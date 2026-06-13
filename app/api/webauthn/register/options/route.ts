import { NextResponse } from "next/server";
import { createRegistrationOptions } from "@/integrations/webauthn/server";

export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const options = await createRegistrationOptions(userId);
  return NextResponse.json(options);
}
