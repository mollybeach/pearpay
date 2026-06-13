import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { verifyRegistration } from "@/integrations/webauthn/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    userId?: string;
    response?: RegistrationResponseJSON;
    challenge?: string;
  };

  if (!body.userId || !body.response || !body.challenge) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const verification = await verifyRegistration(
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
