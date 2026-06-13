"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatAmount, parsePayment, type PayInfo } from "@/lib/imessage";
import { HomeIndicator, PhoneFrame, StatusBar } from "./playground/PhoneFrame";
import { IosKeyboard, usePhysicalKeyboard } from "./playground/IosKeyboard";

/**
 * Interactive Discord payment playground.
 *
 * Run a `/pay` slash command (or natural language) in the #payments channel.
 * The Pear Pay bot posts a rich embed with Confirm / Cancel buttons; confirming
 * settles the payment and the embed flips to a green "Payment Sent" embed —
 * matching Discord's native bot-embed + message-component UX.
 */

type Phase = "idle" | "review" | "processing";

interface Msg {
  id: number;
  kind: "user" | "bottext" | "embed";
  text?: string;
  pay?: PayInfo;
}

const DEFAULT_RECIPIENT = "Maya";
const QUICK = ["/pay maya 25", "/pay dev.eth 100 USDC", "/tip newuser 5"];

const INITIAL: Msg[] = [
  {
    id: 1,
    kind: "bottext",
    text: "Use /pay to send USDC right here in chat. Try `/pay maya 25`.",
  },
];

let mid = 100;
const nextId = () => ++mid;

export function DiscordSimulator() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("/pay maya 25");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<PayInfo | null>(null);
  const [flowId, setFlowId] = useState<number | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const push = useCallback((m: Omit<Msg, "id">) => {
    const id = nextId();
    setMessages((prev) => [...prev, { ...m, id }]);
    return id;
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  const handleSend = useCallback(() => {
    if (phase !== "idle") return;
    const text = draft.trim();
    if (!text) return;
    push({ kind: "user", text });
    setDraft("");

    const pay = parsePayment(text, DEFAULT_RECIPIENT);
    if (pay) {
      setPending(pay);
      window.setTimeout(() => {
        const id = push({ kind: "embed", pay });
        setFlowId(id);
        setPhase("review");
      }, 450);
    } else {
      window.setTimeout(() => {
        push({
          kind: "bottext",
          text: "❔ I didn't catch a payment there. Try `/pay maya 25`.",
        });
      }, 450);
    }
  }, [draft, phase, push]);

  const appendChar = useCallback((ch: string) => setDraft((d) => d + ch), []);
  const backspace = useCallback(() => setDraft((d) => d.slice(0, -1)), []);

  usePhysicalKeyboard({
    enabled: phase === "idle",
    onChar: appendChar,
    onBackspace: backspace,
    onEnter: handleSend,
  });

  function confirm() {
    if (phase !== "review" || !pending) return;
    const p = pending;
    setPhase("processing");
    window.setTimeout(() => {
      setPhase("idle");
      setPending(null);
      window.setTimeout(() => {
        push({
          kind: "bottext",
          text:
            p.outcome === "claimable"
              ? `📨 ${p.recipientName} isn't on Pear Pay yet — claim link sent.`
              : p.outcome === "private"
                ? "🕶️ Sent privately — shielded via Unlink."
                : `Settled ${formatAmount(p)} to ${p.recipientLabel} in USDC.`,
        });
      }, 500);
    }, 1300);
  }

  function cancel() {
    setMessages((prev) => prev.filter((m) => m.id !== flowId));
    setPhase("idle");
    setPending(null);
    setFlowId(null);
    push({ kind: "bottext", text: "Payment cancelled." });
  }

  function resetDemo() {
    setMessages(INITIAL);
    setDraft("/pay maya 25");
    setPhase("idle");
    setPending(null);
    setFlowId(null);
  }

  const fill = (t: string) => {
    if (phase === "idle") setDraft(t);
  };
  const hasText = draft.trim().length > 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => fill(q)}
            className="rounded-full border border-white/10 bg-pear-900/50 px-3 py-1.5 font-mono text-xs text-cream/75 transition hover:border-pear-500/40 hover:text-cream"
          >
            {q}
          </button>
        ))}
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-full border border-white/10 bg-pear-900/50 px-3 py-1.5 text-xs text-cream/55 transition hover:text-cream"
        >
          ↺ Reset
        </button>
      </div>

      <PhoneFrame>
        <div className="bg-[#2b2d31]">
          <StatusBar />
          {/* Channel header */}
          <div className="flex items-center gap-2 px-3 pb-2 pt-1 text-white">
            <span className="text-2xl leading-none">‹</span>
            <span className="text-[20px] text-[#80848e]">#</span>
            <p className="text-[15px] font-semibold">payments</p>
            <div className="ml-auto flex items-center gap-3.5 text-[#b5bac1]">
              <span>🔔</span>
              <span>👥</span>
            </div>
          </div>
        </div>

        {/* Channel messages */}
        <div
          ref={threadRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#313338] px-3 py-3"
        >
          <p className="text-[11px] text-[#949ba4]">
            Welcome to <span className="font-semibold text-white">#payments</span> — pay
            anyone in USDC with one command.
          </p>
          {messages.map((m) => (
            <DcMessage
              key={m.id}
              msg={m}
              active={m.id === flowId && phase !== "idle"}
              phase={phase}
              onConfirm={confirm}
              onCancel={cancel}
            />
          ))}
        </div>

        {/* Input bar */}
        <div className="z-20 shrink-0 bg-[#313338] px-3 pb-2 pt-1">
          <div className="flex items-center gap-2.5 rounded-[20px] bg-[#383a40] px-3 py-2">
            <button
              type="button"
              aria-label="Add"
              onClick={() => fill("/pay maya 25")}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[#b5bac1] text-base leading-none text-[#313338]"
            >
              ＋
            </button>
            <div className="flex-1 text-[15px] text-[#dbdee1]">
              {draft ? (
                <span className="break-words">
                  {draft}
                  <span className="pp-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-[#5865f2]" />
                </span>
              ) : (
                <span className="text-[#6d7178]">Message #payments</span>
              )}
            </div>
            <button
              type="button"
              aria-label="Send"
              onClick={handleSend}
              disabled={!hasText || phase !== "idle"}
              className={`text-lg ${hasText && phase === "idle" ? "text-[#5865f2]" : "text-[#6d7178]"}`}
            >
              {hasText ? "➤" : "🎮"}
            </button>
          </div>
        </div>

        <IosKeyboard
          theme="dark"
          onInput={appendChar}
          onDelete={backspace}
          onReturn={handleSend}
        />
        <HomeIndicator className="bg-[#161618]" />
      </PhoneFrame>

      <p className="max-w-sm text-center text-xs text-cream/45">
        Run <span className="font-mono text-cream/70">/pay</span> in{" "}
        <span className="text-cream/70">#payments</span> and hit{" "}
        <span className="text-cream/70">Confirm</span> on the bot embed. Try{" "}
        <span className="font-mono text-cream/70">/tip newuser 5</span> for the
        claimable flow.
      </p>
    </div>
  );
}

function DcMessage({
  msg,
  active,
  phase,
  onConfirm,
  onCancel,
}: {
  msg: Msg;
  active: boolean;
  phase: Phase;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (msg.kind === "user") {
    return (
      <Row avatar="Y" avatarCls="bg-[#5865f2]" name="you" nameCls="text-white">
        <p className="text-[15px] leading-snug text-[#dbdee1]">{msg.text}</p>
      </Row>
    );
  }

  if (msg.kind === "bottext") {
    return (
      <Row avatar="🍐" avatarCls="bg-[#1f3d12]" name="Pear Pay" nameCls="text-[#a8d672]" bot>
        <p className="text-[15px] leading-snug text-[#dbdee1]">{msg.text}</p>
      </Row>
    );
  }

  // embed
  if (!msg.pay) return null;
  const p = msg.pay;
  const sent = !active; // resting state after confirmation
  const amount = p.outcome === "private" ? "Private" : formatAmount(p);

  return (
    <Row avatar="🍐" avatarCls="bg-[#1f3d12]" name="Pear Pay" nameCls="text-[#a8d672]" bot>
      <div
        className={`max-w-[280px] overflow-hidden rounded-[4px] border-l-4 bg-[#2b2d31] ${
          sent ? "border-[#3ba55c]" : "border-[#74b327]"
        }`}
      >
        <div className="px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
            🍐 {sent ? "Payment Sent" : "Confirm Payment"}
            {sent ? <span className="text-[#3ba55c]">✓</span> : null}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            <Field label="Amount" value={amount} />
            <Field
              label={p.outcome === "claimable" ? "To (new user)" : "To"}
              value={`@${p.recipientName}`}
            />
            <Field label="Network" value="Hedera → Arc" />
            <Field
              label="Status"
              value={
                sent
                  ? p.outcome === "claimable"
                    ? "Escrowed ⏳"
                    : p.outcome === "private"
                      ? "Shielded 🕶️"
                      : "Settled ✅"
                  : "Awaiting confirmation"
              }
            />
          </div>
          {sent && p.outcome === "claimable" ? (
            <p className="mt-2 rounded bg-black/30 px-2 py-1 font-mono text-[11px] text-[#a8d672]">
              pearpay.app/claim/abc123
            </p>
          ) : null}
        </div>
      </div>

      {/* Message component buttons */}
      {!sent ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={phase === "processing"}
            className="flex items-center gap-1.5 rounded-[4px] bg-[#248046] px-3 py-1.5 text-[14px] font-medium text-white transition hover:bg-[#1a6334] disabled:opacity-80"
          >
            {phase === "processing" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Processing…
              </>
            ) : (
              <>✅ Confirm Payment</>
            )}
          </button>
          {phase !== "processing" ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-[4px] bg-[#4e5058] px-3 py-1.5 text-[14px] font-medium text-white transition hover:bg-[#6d6f78]"
            >
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}
    </Row>
  );
}

function Row({
  avatar,
  avatarCls,
  name,
  nameCls,
  bot = false,
  children,
}: {
  avatar: string;
  avatarCls: string;
  name: string;
  nameCls: string;
  bot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="pp-anim-bubble flex gap-2.5">
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarCls}`}
      >
        {avatar}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <span className={`text-[15px] font-medium ${nameCls}`}>{name}</span>
          {bot ? (
            <span className="rounded-[3px] bg-[#5865f2] px-1 py-px text-[9px] font-bold uppercase leading-tight text-white">
              ✓ App
            </span>
          ) : null}
          <span className="text-[11px] text-[#949ba4]">Today at 9:41 AM</span>
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-[#b5bac1]">{label}</p>
      <p className="text-[14px] text-[#dbdee1]">{value}</p>
    </div>
  );
}
