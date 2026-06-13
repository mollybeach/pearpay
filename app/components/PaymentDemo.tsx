"use client";

import { useState, type FormEvent } from "react";
import type { SerializedPaymentLeg, SerializedPaymentResult } from "@/core/payments/serialize";

/**
 * Interactive payment demo.
 *
 * Types a natural-language payment, POSTs it to /api/payments, and renders a
 * payment card per leg — the core Pear Pay UX in the browser. Runs against the
 * backend in local-stub mode so it works live without sponsor credentials.
 */

const DEMO_SENDER = {
  label: "you",
  address: "0x0000000000000000000000000000000000000001",
};

const PROMPTS = [
  "Send Molly $20",
  "Send 50 USDC to molly.eth",
  "Pay alex.eth 50 USDC privately",
  "Send $25 to +1 (206) 947-6991 for dinner",
];

const RAIL: Record<
  NonNullable<SerializedPaymentLeg["rail"]>,
  { label: string; icon: string; className: string }
> = {
  hedera: {
    label: "Hedera",
    icon: "🟣",
    className: "bg-purple-500/15 text-purple-200",
  },
  arc: { label: "Arc", icon: "🔵", className: "bg-sky-500/15 text-sky-200" },
  unlink: {
    label: "Private · Unlink",
    icon: "🕶️",
    className: "bg-zinc-500/20 text-zinc-200",
  },
};

function truncate(value: string): string {
  if (value.length <= 18) return value;
  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

export function PaymentDemo() {
  const [message, setMessage] = useState("Send Molly $20");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [result, setResult] = useState<SerializedPaymentResult | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function send(e?: FormEvent) {
    e?.preventDefault();
    const text = message.trim();
    if (!text || status === "sending") return;

    setStatus("sending");
    setResult(null);
    setErrorMsg("");
    setSentMessage(text);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sender: DEMO_SENDER,
          channel: "imessage",
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | Partial<SerializedPaymentResult>
        | null;

      // Guard every non-success shape: 400 (unparseable), 422 (understood but
      // not settleable), 500 (`{ error }` with no `legs`), or malformed JSON.
      // Without this, `result.legs.map` throws on responses that lack `legs`.
      if (!res.ok || !data || !Array.isArray(data.legs)) {
        setStatus("error");
        setErrorMsg(
          res.status === 400 || res.status === 422
            ? "I couldn't understand that request. Try a sample below."
            : "Something went wrong settling that payment. Please try again.",
        );
        return;
      }

      setResult(data as SerializedPaymentResult);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(`Something went wrong: ${String(err)}`);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Composer */}
      <form
        onSubmit={send}
        className="rounded-2xl border border-white/10 bg-pear-900/60 p-4 shadow-glow"
      >
        <label
          htmlFor="pay-input"
          className="text-xs uppercase tracking-wider text-cream/40"
        >
          Say it like a text
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="pay-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Send Molly $20"
            className="w-full rounded-xl border border-white/10 bg-pear-950 px-4 py-3 text-cream placeholder:text-cream/40 focus:border-pear-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="shrink-0 rounded-xl bg-pear-500 px-5 py-3 font-semibold text-pear-950 transition hover:bg-pear-400 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Pay 🍐"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMessage(p)}
              className="rounded-full border border-white/10 bg-pear-950 px-3 py-1.5 text-xs text-cream/70 transition hover:border-pear-500/40 hover:text-cream"
            >
              {p}
            </button>
          ))}
        </div>
      </form>

      {/* Sent message bubble */}
      {sentMessage && status !== "idle" ? (
        <div className="mt-6 flex justify-end">
          <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-pear-500/20 px-4 py-2 text-cream">
            “{sentMessage}”
          </p>
        </div>
      ) : null}

      {/* Loading */}
      {status === "sending" ? (
        <div className="mt-4 animate-pulse rounded-2xl border border-white/10 bg-pear-900/40 p-6 text-center text-cream/50">
          Resolving recipient, picking a rail, settling in USDC…
        </div>
      ) : null}

      {/* Error */}
      {status === "error" ? (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {errorMsg}
        </div>
      ) : null}

      {/* Result */}
      {status === "done" && result ? (
        <div className="mt-4 space-y-4">
          {/* Assistant summary bubble */}
          <div className="flex justify-start">
            <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white/5 px-4 py-2 text-cream/90">
              <span className="mr-1">🍐</span>
              {result.summary}
            </p>
          </div>

          {result.legs.map((leg, i) => (
            <PaymentCard key={`${leg.recipient.label}-${i}`} leg={leg} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PaymentCard({ leg }: { leg: SerializedPaymentLeg }) {
  const instant = leg.outcome === "instant";
  const rail = leg.rail ? RAIL[leg.rail] : null;
  const { recipient, amount } = leg;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-pear-900/70 to-pear-950 shadow-glow">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pear-500/20 text-sm">
            {recipient.hint === "ens"
              ? "🪪"
              : recipient.hint === "phone"
                ? "📱"
                : recipient.hint === "email"
                  ? "✉️"
                  : "👤"}
          </span>
          <div>
            <p className="font-semibold leading-tight">{recipient.label}</p>
            <p className="text-xs text-cream/45">
              {recipient.isPearPayUser ? "Pear Pay user" : "new recipient"}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            instant
              ? "bg-pear-500/20 text-pear-200"
              : "bg-amber-500/15 text-amber-200"
          }`}
        >
          {instant ? "Settled ✅" : "Claimable ⏳"}
        </span>
      </div>

      <div className="px-5 py-4">
        <p className="text-3xl font-extrabold tracking-tight">{amount.display}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {rail ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${rail.className}`}
            >
              {rail.icon} {rail.label}
            </span>
          ) : null}
          {leg.private ? (
            <span className="rounded-full bg-zinc-500/20 px-3 py-1 text-xs font-medium text-zinc-200">
              🕶️ Private
            </span>
          ) : null}
          {!instant ? (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-cream/70">
              via {recipient.notificationChannel.toUpperCase()}
            </span>
          ) : null}
          {leg.route ? (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-cream/70">
              {leg.route}
            </span>
          ) : null}
        </div>

        {/* Settlement reference for instant legs */}
        {instant && (leg.txHash || leg.settlementRef) ? (
          <p className="mt-4 break-all font-mono text-xs text-cream/45">
            ref {truncate(leg.txHash ?? leg.settlementRef ?? "")}
          </p>
        ) : null}

        {/* Claim link for claimable legs */}
        {!instant && leg.claimUrl ? <ClaimLink url={leg.claimUrl} /> : null}
      </div>
    </div>
  );
}

function ClaimLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-wider text-cream/40">
        Claim link
      </p>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-pear-950 px-3 py-2 font-mono text-xs text-pear-200">
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-cream transition hover:bg-white/5"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
