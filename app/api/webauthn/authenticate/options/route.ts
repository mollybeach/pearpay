import { NextResponse } from "next/server";
import { createAuthenticationOptions } from "@/integrations/webauthn/server";
import { getUserCredentials } from "@/integrations/webauthn/store";

export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const creds = getUserCredentials(userId);
  if (creds.length === 0) {
    return NextResponse.json({ needsRegistration: true }, { status: 404 });
  }

  const options = await createAuthenticationOptions(userId);
  return NextResponse.json(options);
}
