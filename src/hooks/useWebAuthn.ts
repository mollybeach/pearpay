"use client";

import { useCallback, useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

const CHALLENGE_KEY = "pearpay_webauthn_challenge";
const USER_KEY = "pearpay_webauthn_user";

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "demo-user";
  let userId = localStorage.getItem(USER_KEY);
  if (!userId) {
    userId = `user-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem(USER_KEY, userId);
  }
  return userId;
}

export type WebAuthnStatus =
  | "idle"
  | "registering"
  | "authenticating"
  | "verified"
  | "error";

export function useWebAuthn() {
  const [status, setStatus] = useState<WebAuthnStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async () => {
    setStatus("registering");
    setError(null);
    const userId = getOrCreateUserId();

    try {
      const optionsRes = await fetch("/api/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!optionsRes.ok) throw new Error("Failed to get registration options");
      const options = await optionsRes.json();
      sessionStorage.setItem(CHALLENGE_KEY, options.challenge);

      const attestation = await startRegistration({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          response: attestation,
          challenge: options.challenge,
        }),
      });
      if (!verifyRes.ok) throw new Error("Registration verification failed");
      const result = await verifyRes.json();
      if (!result.verified) throw new Error("Registration not verified");
      setStatus("verified");
      return true;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Registration failed");
      return false;
    }
  }, []);

  const authenticate = useCallback(async () => {
    setStatus("authenticating");
    setError(null);
    const userId = getOrCreateUserId();

    try {
      const optionsRes = await fetch("/api/webauthn/authenticate/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!optionsRes.ok) {
        const data = await optionsRes.json().catch(() => ({}));
        if (data.needsRegistration) {
          return register();
        }
        throw new Error("Failed to get authentication options");
      }
      const options = await optionsRes.json();
      sessionStorage.setItem(CHALLENGE_KEY, options.challenge);

      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyRes = await fetch("/api/webauthn/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          response: assertion,
          challenge: options.challenge,
        }),
      });
      if (!verifyRes.ok) throw new Error("Authentication verification failed");
      const result = await verifyRes.json();
      if (!result.verified) throw new Error("Authentication not verified");
      setStatus("verified");
      return true;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Authentication failed");
      return false;
    }
  }, [register]);

  return {
    status,
    error,
    register,
    authenticate,
    reset: () => setStatus("idle"),
  };
}
