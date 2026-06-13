"use client";

import { useState } from "react";

interface AgentStatus {
  configured: boolean;
  wallet_address: string | null;
}

interface AgentAction {
  action: string;
  [key: string]: unknown;
}

export function AgentDemo() {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [intent, setIntent] = useState("Fetch premium agent intelligence");

  async function loadStatus() {
    try {
      const res = await fetch("/api/agent/status");
      setStatus(await res.json());
    } catch {
      setStatus({ configured: false, wallet_address: null });
    }
  }

  async function runAutonomous() {
    setLoading(true);
    setResult(null);
    try {
      await fetch("/api/agent/initialize", { method: "POST" });
      const res = await fetch("/api/agent/run-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: intent }),
      });
      const data = await res.json();
      setResult(data);
      const actionsRes = await fetch("/api/agent/actions");
      const actionsData = await actionsRes.json();
      setActions(actionsData.actions ?? []);
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Agent failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-xl space-y-4 rounded-2xl border border-pear-500/20 bg-pear-900/40 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-cream">Agentic Economy</h2>
          <p className="text-xs text-cream/50">
            Server wallet · autonomous x402 · Flow funding
          </p>
        </div>
        <button
          type="button"
          onClick={loadStatus}
          className="text-xs text-pear-400 hover:underline"
        >
          Refresh status
        </button>
      </div>

      {status && (
        <p className="text-xs text-cream/60">
          Wallet: {status.wallet_address ?? "not initialized"} ·{" "}
          {status.configured ? "Dynamic configured" : "stub mode"}
        </p>
      )}

      <input
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-pear-950 px-3 py-2 text-sm text-cream"
        placeholder="Agent intent…"
      />

      <button
        type="button"
        onClick={runAutonomous}
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? "Agent executing…" : "Run Autonomous Agent"}
      </button>

      {result && (
        <pre className="max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-[11px] text-emerald-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {actions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-cream/70">Agent action log</p>
          {actions.slice(-5).map((a, i) => (
            <p key={i} className="text-[10px] text-cream/40">
              {a.action}: {JSON.stringify(a).slice(0, 80)}…
            </p>
          ))}
        </div>
      )}

      <p className="text-[10px] text-cream/30">
        Proposer boundary: user payments need FaceID. Agent pays APIs
        autonomously via server wallet.
      </p>
    </div>
  );
}
