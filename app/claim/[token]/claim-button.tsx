"use client";

import { useState } from "react";

/**
 * Client-side claim action. Calls POST /api/claim/:token which provisions a
 * Dynamic embedded wallet and releases the escrowed USDC.
 */
export function ClaimButton({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "claiming" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string>("");

  async function claim() {
    setStatus("claiming");
    try {
      const res = await fetch(`/api/claim/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // In production this identifier comes from Dynamic social auth.
        body: JSON.stringify({ recipientIdentifier: `claimant:${token}` }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message ?? "Claim failed");
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(String(err));
    }
  }

  if (status === "done") {
    return (
      <p style={{ color: "#7ee8b0", fontSize: 18 }}>
        ✅ Claimed — funds are on the way.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={claim}
        disabled={status === "claiming"}
        style={{
          background: "#1fbf6f",
          color: "#06160e",
          border: "none",
          borderRadius: 12,
          padding: "14px 28px",
          fontSize: 18,
          fontWeight: 700,
          cursor: status === "claiming" ? "default" : "pointer",
          opacity: status === "claiming" ? 0.7 : 1,
        }}
      >
        {status === "claiming" ? "Claiming…" : "Claim your funds"}
      </button>
      {status === "error" ? (
        <p style={{ color: "#ff9d9d", marginTop: 12, fontSize: 14 }}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
