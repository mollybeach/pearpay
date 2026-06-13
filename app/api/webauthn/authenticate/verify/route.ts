import { NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { verifyAuthentication } from "@/integrations/webauthn/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    response?: AuthenticationResponseJSON;
    challenge?: string;
  };

  if (!body.userId || !body.response || !body.challenge) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const verification = await verifyAuthentication(
      body.userId,
      body.response,
      body.challenge,
    );
    return NextResponse.json({ verified: verification.verified });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 400 },
    );
  }
}
