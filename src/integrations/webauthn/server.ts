import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { getEnv } from "@/lib/env";
import {
  findCredential,
  getUserCredentials,
  saveCredential,
  updateCredentialCounter,
} from "./store";

function webauthnConfig() {
  const env = getEnv();
  return {
    rpName: env.WEBAUTHN_RP_NAME,
    rpID: env.WEBAUTHN_RP_ID,
    origin: env.WEBAUTHN_ORIGIN,
  };
}

export async function createRegistrationOptions(userId: string) {
  const { rpName, rpID } = webauthnConfig();
  const userCredentials = getUserCredentials(userId);

  return generateRegistrationOptions({
    rpName,
    rpID,
    userName: userId,
    userDisplayName: userId,
    attestationType: "none",
    excludeCredentials: userCredentials.map((cred) => ({
      id: cred.credentialID,
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
  });
}

export async function verifyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  expectedChallenge: string,
) {
  const { rpID, origin } = webauthnConfig();
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (verification.verified) {
    saveCredential(userId, verification);
  }

  return verification;
}

export async function createAuthenticationOptions(userId: string) {
  const { rpID } = webauthnConfig();
  const userCredentials = getUserCredentials(userId);

  return generateAuthenticationOptions({
    rpID,
    allowCredentials: userCredentials.map((cred) => ({
      id: cred.credentialID,
      transports: cred.transports,
    })),
    userVerification: "required",
  });
}

export async function verifyAuthentication(
  userId: string,
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
) {
  const { rpID, origin } = webauthnConfig();
  const credential = findCredential(userId, response.id);
  if (!credential) {
    throw new Error("Credential not found");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credential.credentialID,
      publicKey: new Uint8Array(credential.credentialPublicKey),
      counter: credential.counter,
      transports: credential.transports,
    },
    requireUserVerification: true,
  });

  if (verification.verified && verification.authenticationInfo) {
    updateCredentialCounter(
      userId,
      credential.credentialID,
      verification.authenticationInfo.newCounter,
    );
  }

  return verification;
}
