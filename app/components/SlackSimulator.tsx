"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatAmount, parsePayment, type PayInfo } from "@/lib/imessage";
import { HomeIndicator, PhoneFrame, StatusBar } from "./playground/PhoneFrame";
import { IosKeyboard, usePhysicalKeyboard } from "./playground/IosKeyboard";

/**
 * Interactive Slack payment playground.
 *
 * Post in #team-lunch and the Pear Pay app replies with a Block Kit message.
 * "Split lunch with the engineering team" fans out into an even split with a
 * Confirm Split button; a direct "Pay @sarah $30" settles a single payment —
 * matching Slack's app + interactive-message UX.
 */

type Phase = "idle" | "review" | "processing";

interface SplitInfo {
  total: number;
  members: string[];
  per: number;
  memo: string;
}
interface Msg {
  id: number;
  kind: "user" | "apptext" | "split" | "pay";
  text?: string;
  split?: SplitInfo;
  pay?: PayInfo;
}

const TEAM = ["sarah", "alex", "jordan"];
const QUICK = [
  "Split lunch with the engineering team",
  "Pay @sarah $30",
  "Split the $200 Airbnb with the team",
];

const INITIAL: Msg[] = [
  {
    id: 1,
    kind: "apptext",
    text: "Pear Pay is connected to #team-lunch. Try “Split lunch with the engineering team”.",
  },
];

let mid = 100;
const nextId = () => ++mid;

function detectSplit(text: string): SplitInfo | null {
  if (!/\b(split|divide|share)\b/i.test(text)) return null;
  const amt = text.match(/\$?\b(\d[\d,]*(?:\.\d{1,2})?)\b/);
  const total = amt ? parseFloat(amt[1]!.replace(/,/g, "")) : 48;
  const members = TEAM;
  const headcount = members.length + 1; // includes you, the payer
  const per = Math.round((total / headcount) * 100) / 100;
  const memoMatch = text.match(/\bsplit\s+(?:the\s+)?(?:\$?[\d,.]+\s+)?(.+?)\s+with\b/i);
  const memo = memoMatch?.[1]?.trim() || "lunch";
  return { total, members, per, memo };
}

export function SlackSimulator() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("Split lunch with the engineering team");
  const [phase, setPhase] = useState<Phase>("idle");
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

    const split = detectSplit(text);
    if (split) {
      window.setTimeout(() => {
        const id = push({ kind: "split", split });
        setFlowId(id);
        setPhase("review");
      }, 450);
      return;
    }
    const pay = parsePayment(text, "sarah");
    if (pay) {
      window.setTimeout(() => {
        const id = push({ kind: "pay", pay });
        setFlowId(id);
        setPhase("review");
      }, 450);
      return;
    }
    window.setTimeout(() => {
      push({
        kind: "apptext",
        text: "I can split a bill or pay a teammate 💸 Try “Split lunch with the engineering team”.",
      });
    }, 450);
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
    if (phase !== "review") return;
    setPhase("processing");
    window.setTimeout(() => {
      setPhase("idle");
      setFlowId(null);
    }, 1300);
  }
  function cancel() {
    setMessages((prev) => prev.filter((m) => m.id !== flowId));
    setPhase("idle");
    setFlowId(null);
    push({ kind: "apptext", text: "Okay, cancelled. :wave:" });
  }

  function resetDemo() {
    setMessages(INITIAL);
    setDraft("Split lunch with the engineering team");
    setPhase("idle");
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
            className="rounded-full border border-white/10 bg-pear-900/50 px-3 py-1.5 text-xs text-cream/75 transition hover:border-pear-500/40 hover:text-cream"
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
        <div className="bg-[#1a1d21]">
          <StatusBar />
          <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-2 pt-1 text-white">
            <span className="text-2xl leading-none">‹</span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold">
                <span className="text-[#a8a8a8]"># </span>team-lunch
              </p>
              <p className="text-[11px] text-[#a8a8a8]">4 members</p>
            </div>
            <div className="ml-auto text-[18px] text-[#a8a8a8]">☰</div>
          </div>
        </div>

        {/* Channel messages */}
        <div
          ref={threadRef}
          className="flex flex-1 flex-col gap-3 overflow-y-auto bg-[#1a1d21] px-3 py-3"
        >
          <p className="text-[12px] text-[#abadb0]">
            👋 You&apos;re in{" "}
            <span className="font-bold text-white">#team-lunch</span>. Settle up
            with one message.
          </p>
          {messages.map((m) => (
            <SlackMessage
              key={m.id}
              msg={m}
              active={m.id === flowId && phase !== "idle"}
              done={m.id === flowId && phase === "idle"}
              phase={phase}
              onConfirm={confirm}
              onCancel={cancel}
            />
          ))}
        </div>

        {/* Input */}
        <div className="z-20 shrink-0 bg-[#1a1d21] px-3 pb-2 pt-1">
          <div className="rounded-lg border border-[#565856] bg-[#222529] px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 text-[15px] text-[#d1d2d3]">
                {draft ? (
                  <span className="break-words">
                    {draft}
                    <span className="pp-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-[#1d9bd1]" />
                  </span>
                ) : (
                  <span className="text-[#8d8f93]">Message #team-lunch</span>
                )}
              </div>
              <button
                type="button"
                aria-label="Send"
                onClick={handleSend}
                disabled={!hasText || phase !== "idle"}
                className={`flex h-7 w-7 items-center justify-center rounded text-sm text-white ${
                  hasText && phase === "idle" ? "bg-[#007a5a]" : "bg-[#37474a]"
                }`}
              >
                ➤
              </button>
            </div>
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
        Post in #team-lunch and the Pear Pay app replies with an interactive
        message. “Split lunch with the engineering team” fans out an even split
        you confirm in one tap.
      </p>
    </div>
  );
}

function SlackMessage({
  msg,
  active,
  done,
  phase,
  onConfirm,
  onCancel,
}: {
  msg: Msg;
  active: boolean;
  done: boolean;
  phase: Phase;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (msg.kind === "user") {
    return (
      <Row avatar="Y" avatarCls="bg-[#4a154b]" name="you">
        <p className="text-[15px] text-[#d1d2d3]">{msg.text}</p>
      </Row>
    );
  }
  if (msg.kind === "apptext") {
    return (
      <Row avatar="🍐" avatarCls="bg-[#1f3d12]" name="Pear Pay" app>
        <p className="text-[15px] text-[#d1d2d3]">{msg.text}</p>
      </Row>
    );
  }

  if (msg.kind === "split" && msg.split) {
    const s = msg.split;
    return (
      <Row avatar="🍐" avatarCls="bg-[#1f3d12]" name="Pear Pay" app>
        <div className="max-w-[300px] overflow-hidden rounded-md border-l-4 border-[#74b327] bg-[#222529]">
          <div className="px-3 py-2.5">
            <p className="text-[14px] font-bold text-white">
              🍐 {done ? "Split settled" : "Split the bill"} · {s.memo}
            </p>
            <p className="mt-1 text-[13px] text-[#d1d2d3]">
              <b>${s.total.toFixed(2)}</b> across {s.members.length + 1} people ={" "}
              <b>${s.per.toFixed(2)} each</b>
            </p>
            <div className="mt-2 space-y-1">
              {s.members.map((m) => (
                <div key={m} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#d1d2d3]">@{m}</span>
                  <span className="font-mono text-[#a8d672]">
                    ${s.per.toFixed(2)} {done ? "✅" : ""}
                  </span>
                </div>
              ))}
            </div>
            {done ? (
              <p className="mt-2 rounded bg-black/30 px-2 py-1 text-[12px] text-[#a8d672]">
                ✅ Settled ${(s.per * s.members.length).toFixed(2)} in USDC ·
                Hedera → Arc
              </p>
            ) : null}
          </div>
          {active && phase === "review" ? (
            <div className="flex gap-2 border-t border-white/5 px-3 py-2">
              <button
                type="button"
                onClick={onConfirm}
                className="rounded bg-[#007a5a] px-3 py-1.5 text-[13px] font-semibold text-white"
              >
                Confirm Split
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded border border-[#565856] px-3 py-1.5 text-[13px] font-medium text-[#d1d2d3]"
              >
                Cancel
              </button>
            </div>
          ) : active && phase === "processing" ? (
            <div className="border-t border-white/5 px-3 py-2 text-[13px] text-[#abadb0]">
              ⏳ Settling…
            </div>
          ) : null}
        </div>
      </Row>
    );
  }

  if (msg.kind === "pay" && msg.pay) {
    const p = msg.pay;
    return (
      <Row avatar="🍐" avatarCls="bg-[#1f3d12]" name="Pear Pay" app>
        <div className="max-w-[300px] overflow-hidden rounded-md border-l-4 border-[#74b327] bg-[#222529]">
          <div className="px-3 py-2.5 text-[14px] text-[#d1d2d3]">
            <p className="font-bold text-white">🍐 {done ? "Payment sent" : "Confirm payment"}</p>
            <p className="mt-1">
              {done ? "Sent" : "Send"} <b>{formatAmount(p)}</b> to{" "}
              <b>@{p.recipientName}</b> {done ? "✅" : "?"}
            </p>
            {done ? (
              <p className="mt-1 text-[12px] text-[#a8d672]">Settled in USDC · Hedera → Arc</p>
            ) : null}
          </div>
          {active && phase === "review" ? (
            <div className="flex gap-2 border-t border-white/5 px-3 py-2">
              <button
                type="button"
                onClick={onConfirm}
                className="rounded bg-[#007a5a] px-3 py-1.5 text-[13px] font-semibold text-white"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded border border-[#565856] px-3 py-1.5 text-[13px] font-medium text-[#d1d2d3]"
              >
                Cancel
              </button>
            </div>
          ) : active && phase === "processing" ? (
            <div className="border-t border-white/5 px-3 py-2 text-[13px] text-[#abadb0]">
              ⏳ Settling…
            </div>
          ) : null}
        </div>
      </Row>
    );
  }

  return null;
}

function Row({
  avatar,
  avatarCls,
  name,
  app = false,
  children,
}: {
  avatar: string;
  avatarCls: string;
  name: string;
  app?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="pp-anim-bubble flex gap-2">
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-sm font-bold text-white ${avatarCls}`}
      >
        {avatar}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold text-white">{name}</span>
          {app ? (
            <span className="rounded-[3px] bg-[#626568] px-1 py-px text-[9px] font-bold uppercase leading-tight text-white">
              App
            </span>
          ) : null}
          <span className="text-[11px] text-[#abadb0]">9:41 AM</span>
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
