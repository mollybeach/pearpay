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
    setMessage("");
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
      <div>
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-semibold text-pear-200">
          Claimed — funds are on the way
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={claim}
        disabled={status === "claiming"}
        className="w-full rounded-xl bg-pear-500 px-7 py-4 text-lg font-bold text-pear-950 shadow-glow transition hover:bg-pear-400 disabled:cursor-default disabled:opacity-70"
      >
        {status === "claiming" ? "Claiming…" : "Claim your funds"}
      </button>
      {status === "error" ? (
        <p className="mt-3 text-sm text-red-300">{message}</p>
      ) : null}
    </div>
  );
}
