"use client";

import { useState } from "react";
import { LivePhonePayment } from "./LivePhonePayment";
import { RealPayment } from "./RealPayment";
import { PaymentDemo } from "./PaymentDemo";

/**
 * Tabbed hub for the "Try it" page — mirrors the chat playground's segmented
 * switcher. The default is the live in-chat iPhone experience (a REAL on-chain
 * USDC transfer inside the iMessage UI); the other modes keep the classic form
 * and the natural-language API demo. One mode shows at a time.
 */

type Mode = "phone" | "real" | "natural";

const TABS: { id: Mode; label: string; icon: string; blurb: string }[] = [
  {
    id: "phone",
    label: "In-chat (live)",
    icon: "💬",
    blurb:
      "The real thing, inside the chat: type an amount, tap send, confirm in the Apple-Pay-style sheet — it broadcasts a real USDC transfer on Arc Testnet with a verifiable explorer link.",
  },
  {
    id: "real",
    label: "Classic form",
    icon: "🔵",
    blurb:
      "Same real on-chain transfer in a plain form — connect your wallet, enter a recipient and amount, and send. Running on Arc Testnet so it's free to try.",
  },
  {
    id: "natural",
    label: "Say it like a text",
    icon: "✨",
    blurb:
      "Type a payment in plain English and watch Pear Pay resolve the recipient, pick a settlement rail, and settle in USDC.",
  },
];

export function PayPlayground() {
  const [mode, setMode] = useState<Mode>("phone");
  const active = TABS.find((t) => t.id === mode)!;

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Mode switcher — same chrome as the chat playground tabs */}
      <div
        role="tablist"
        aria-label="Payment mode"
        className="flex flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-pear-900/50 p-1"
      >
        {TABS.map((t) => {
          const isActive = mode === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(t.id)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition sm:px-4 ${
                isActive
                  ? "bg-pear-500 text-pear-950 shadow-glow"
                  : "text-cream/70 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <span aria-hidden className="mr-1.5">
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Per-mode caption */}
      <p className="mx-auto -mt-2 max-w-xl text-center text-sm text-cream/65">
        {active.blurb}
      </p>

      {/* Keying by mode resets each surface's state when you switch. */}
      <div className="w-full">
        {mode === "phone" ? (
          <LivePhonePayment key="phone" />
        ) : mode === "real" ? (
          <RealPayment key="real" />
        ) : (
          <PaymentDemo key="natural" />
        )}
      </div>

      {mode === "natural" ? (
        <p className="text-center text-xs text-cream/40">
          The natural-language demo runs against the API in sandbox mode.
        </p>
      ) : null}
    </div>
  );
}
