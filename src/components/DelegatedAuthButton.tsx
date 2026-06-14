"use client";

import { useDelegatedAuth } from "@/hooks/useDelegatedAuth";

const LABEL: Record<string, string> = {
  idle: "Authorize with Face ID",
  authenticating: "Verifying Face ID…",
  delegating: "Granting agent access…",
  delegated: "Agent authorized ✓",
  error: "Try again",
};

/**
 * Modular drop-in: one tap runs FaceID/WebAuthn, then delegates MPC signing
 * authority to the PearPay backend. After this, the server agent can settle
 * the user's payment legs autonomously — no repeated prompts.
 */
export function DelegatedAuthButton({
  onDelegated,
}: {
  onDelegated?: (address?: string) => void;
}) {
  const { status, error, address, authorizeAndDelegate } = useDelegatedAuth();
  const busy = status === "authenticating" || status === "delegating";
  const done = status === "delegated";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy || done}
        onClick={async () => {
          const ok = await authorizeAndDelegate();
          if (ok) onDelegated?.(address);
        }}
        className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-xl border border-white/20 shadow-2xl transition enabled:hover:bg-white/15 disabled:opacity-60"
        aria-busy={busy}
      >
        {LABEL[status] ?? LABEL.idle}
      </button>

      {done && address && (
        <p className="text-xs text-emerald-300/80">
          Delegated for {address.slice(0, 6)}…{address.slice(-4)}
        </p>
      )}
      {status === "error" && error && (
        <p className="text-xs text-rose-300/80">{error}</p>
      )}
    </div>
  );
}
