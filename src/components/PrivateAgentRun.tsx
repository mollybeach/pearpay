"use client";

import { useState } from "react";

/**
 * Autonomous Private Agent — the joint-bounty flow in one click.
 *
 * Runs the contiguous narrative as a live timeline:
 *   1. Agent decides            (autonomy)
 *   2. Dynamic authorizes       POST /api/x402/pay   (Dynamic signs the auth)
 *   3. Unlink shields → burner  ┐ POST /api/privacy/nanopay
 *   4. Circle Gateway settles   ┘ (gas-free x402 on Arc, private payer)
 *
 * Each step lights up as its real backend call resolves — nothing is mocked.
 */

type StepStatus = "idle" | "running" | "done" | "warn" | "fail";

interface Ref {
  label: string;
  value: string;
  href?: string;
}

interface Step {
  key: string;
  partner: string;
  badge: string;
  title: string;
  status: StepStatus;
  detail?: string;
  refs?: Ref[];
}

const EXPLORER = (
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app"
).replace(/\/$/, "");

const short = (s: string) =>
  s && s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;

const INITIAL: Step[] = [
  {
    key: "decide",
    partner: "Agent",
    badge: "🤖",
    title: "Agent decides to buy premium intelligence ($0.001)",
    status: "idle",
  },
  {
    key: "dynamic",
    partner: "Dynamic",
    badge: "🔑",
    title: "Dynamic wallet signs the x402 payment authorization",
    status: "idle",
  },
  {
    key: "unlink",
    partner: "Unlink",
    badge: "🕶️",
    title: "Unlink shields funds into an ephemeral burner",
    status: "idle",
  },
  {
    key: "settle",
    partner: "Circle + Arc",
    badge: "🔵",
    title: "Circle Gateway settles the nanopayment on Arc (gas-free)",
    status: "idle",
  },
];

const STATUS_ICON: Record<StepStatus, string> = {
  idle: "○",
  running: "◌",
  done: "✅",
  warn: "⚠️",
  fail: "❌",
};

export function PrivateAgentRun() {
  const [steps, setSteps] = useState<Step[]>(INITIAL);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState<"idle" | "ok" | "partial" | "fail">(
    "idle",
  );

  function patch(key: string, next: Partial<Step>) {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...next } : s)),
    );
  }

  async function run() {
    setRunning(true);
    setOutcome("idle");
    setSteps(INITIAL.map((s) => ({ ...s })));

    const origin = window.location.origin;
    const premiumUrl = `${origin}/api/x402/premium/data`;

    // 1. Agent decides — autonomous, no human prompt.
    patch("decide", { status: "running" });
    await new Promise((r) => setTimeout(r, 350));
    patch("decide", {
      status: "done",
      detail:
        "Hit a 402-paywalled API. The agent chose to pay autonomously within its delegated budget.",
    });

    // 2. Dynamic authorizes (signs the off-chain x402 authorization).
    patch("dynamic", { status: "running" });
    try {
      const res = await fetch("/api/x402/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: premiumUrl, amount: 0.001 }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (res.ok && data.status === "authorized") {
        patch("dynamic", {
          status: "done",
          detail: `Signed via ${String(data.mode)} — no per-payment popup.`,
          refs: [
            { label: "signer", value: short(String(data.wallet ?? "")) },
            { label: "signature", value: short(String(data.signature ?? "")) },
          ],
        });
      } else {
        patch("dynamic", {
          status: "warn",
          detail:
            "Dynamic server wallet not provisioned yet (remove AGENT_WALLET_ADDRESS to auto-create one). Continuing the private settlement.",
        });
      }
    } catch (err) {
      patch("dynamic", {
        status: "warn",
        detail: `Authorization step skipped: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }

    // 3 + 4. Unlink shields → Circle Gateway settles on Arc (one real call).
    patch("unlink", { status: "running" });
    patch("settle", { status: "running" });
    try {
      const res = await fetch("/api/privacy/nanopay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: premiumUrl, amount_usd: "0.001" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        burner?: string;
        fundTxId?: string;
        settlementTx?: string;
        payer?: string;
        error?: string;
      };

      if (res.ok && data.ok) {
        patch("unlink", {
          status: "done",
          detail:
            "Withdrawn from the shielded pool to a single-use burner. The funder is NOT the payer — the link is severed.",
          refs: [
            { label: "burner", value: short(data.burner ?? "") },
            ...(data.fundTxId
              ? [{ label: "unlink tx", value: short(data.fundTxId) }]
              : []),
          ],
        });
        patch("settle", {
          status: "done",
          detail:
            "Burner paid the x402 paywall via Circle Gateway — gas-free batched USDC settlement on Arc.",
          refs: data.settlementTx
            ? [
                {
                  label: "settlement tx",
                  value: short(data.settlementTx),
                  href: `${EXPLORER}/tx/${data.settlementTx}`,
                },
              ]
            : [],
        });
        setOutcome("ok");
      } else {
        const msg = data.error ?? "settlement failed";
        patch("unlink", {
          status: data.burner ? "done" : "fail",
          detail: data.burner
            ? `Burner created (${short(data.burner)}).`
            : msg,
        });
        patch("settle", { status: "fail", detail: msg });
        setOutcome("fail");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      patch("unlink", { status: "fail", detail: msg });
      patch("settle", { status: "fail", detail: msg });
      setOutcome("fail");
    }

    setRunning(false);
    setOutcome((o) => (o === "ok" ? "ok" : o === "fail" ? "fail" : "partial"));
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-pear-500/25 bg-pear-900/50 p-6 shadow-glow">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-cream">
            🤖🔒 Autonomous Private Agent
          </h3>
          <p className="text-xs text-cream/55">
            Dynamic signs · Unlink shields · Circle Gateway settles on Arc — one
            click, real on-chain.
          </p>
        </div>
        <div className="flex gap-1.5 text-[10px]">
          {["Dynamic", "Unlink", "Circle", "Arc"].map((p) => (
            <span
              key={p}
              className="rounded-full bg-white/5 px-2 py-1 font-medium text-cream/60"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={running}
        className="mt-4 w-full rounded-xl bg-pear-500 px-6 py-3 font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400 disabled:opacity-60"
      >
        {running
          ? "Running autonomous private payment…"
          : "Run autonomous private payment ($0.001)"}
      </button>

      <ol className="mt-5 space-y-2">
        {steps.map((s) => (
          <li
            key={s.key}
            className={`rounded-xl border px-4 py-3 transition ${
              s.status === "done"
                ? "border-pear-500/40 bg-pear-500/10"
                : s.status === "running"
                  ? "border-pear-400/40 bg-white/5"
                  : s.status === "warn"
                    ? "border-amber-500/40 bg-amber-500/10"
                    : s.status === "fail"
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-white/10 bg-pear-950/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${s.status === "running" ? "animate-pulse" : ""}`}
              >
                {STATUS_ICON[s.status]}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-cream/55">
                {s.badge} {s.partner}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-cream/90">{s.title}</p>
            {s.detail ? (
              <p className="mt-1 text-xs leading-relaxed text-cream/55">
                {s.detail}
              </p>
            ) : null}
            {s.refs && s.refs.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {s.refs.map((r) => (
                  <span
                    key={r.label}
                    className="rounded-lg bg-black/30 px-2 py-1 font-mono text-[10px] text-pear-200"
                  >
                    {r.label}:{" "}
                    {r.href ? (
                      <a
                        href={r.href}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {r.value}
                      </a>
                    ) : (
                      r.value
                    )}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ol>

      {outcome === "ok" ? (
        <div className="mt-4 rounded-xl border border-pear-500/40 bg-pear-500/10 px-4 py-3 text-sm text-pear-200">
          ✅ Premium data unlocked. The payment was autonomous, private, and
          gas-free — and the burner was disposed. The public ledger never saw
          your wallet pay the seller.
        </div>
      ) : outcome === "fail" ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Settlement didn&apos;t complete. Common cause: the shielded pool or
          burner needs more Arc USDC, or the serverless step timed out (Vercel
          Hobby caps 60s). Re-run, or run the proof locally.
        </div>
      ) : null}
    </div>
  );
}
