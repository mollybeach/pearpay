"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatAmount, parsePayment, type PayInfo } from "@/lib/imessage";
import { HomeIndicator, PhoneFrame, StatusBar } from "./playground/PhoneFrame";
import { IosKeyboard, usePhysicalKeyboard } from "./playground/IosKeyboard";
import { PearPayCard } from "./playground/PearPayCard";

/**
 * Interactive X (Twitter) DM payment playground.
 *
 * Slide into the @PearPay DMs: "Send 50 USDC to @molly" gets a confirmation
 * card reply, and confirming drops the settled Pear Pay card into the
 * conversation — matching X's DM + card-CTA UX.
 */

type From = "me" | "bot";
type Phase = "idle" | "review" | "processing";

interface Msg {
  id: number;
  from: From;
  kind: "text" | "review" | "card";
  text?: string;
  pay?: PayInfo;
}

const QUICK = ["Send 50 USDC to @molly", "Pay @alex $40", "Send @dev 100 USDC privately"];

const INITIAL: Msg[] = [
  {
    id: 1,
    from: "bot",
    kind: "text",
    text: "DM me a payment and I'll handle the rest 🍐 e.g. “Send 50 USDC to @molly”.",
  },
];

let mid = 100;
const nextId = () => ++mid;

export function XSimulator() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("Send 50 USDC to @molly");
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
    push({ from: "me", kind: "text", text });
    setDraft("");

    const pay = parsePayment(text, "molly");
    if (pay) {
      setPending(pay);
      window.setTimeout(() => {
        const id = push({ from: "bot", kind: "review", pay });
        setFlowId(id);
        setPhase("review");
      }, 450);
    } else {
      window.setTimeout(() => {
        push({
          from: "bot",
          kind: "text",
          text: "Couldn't read a payment there. Try “Send 50 USDC to @molly”.",
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
      push({ from: "bot", kind: "card", pay: p });
      window.setTimeout(() => {
        push({
          from: "bot",
          kind: "text",
          text:
            p.outcome === "claimable"
              ? `Sent! ${p.recipientName} will get a claim link for the ${formatAmount(p)}.`
              : p.outcome === "private"
                ? "Sent privately 🕶️ — amount & counterparty shielded via Unlink."
                : `Sent ${formatAmount(p)} to ${p.recipientLabel}, settled in USDC ✅`,
        });
        setPhase("idle");
        setPending(null);
        setFlowId(null);
      }, 600);
    }, 1300);
  }

  function resetDemo() {
    setMessages(INITIAL);
    setDraft("Send 50 USDC to @molly");
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
        <div className="bg-black">
          <StatusBar />
          <div className="flex items-center gap-2.5 border-b border-[#2f3336] px-3 pb-2 pt-1 text-white">
            <span className="text-2xl leading-none">‹</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16181c] text-base">
              🍐
            </span>
            <div className="leading-tight">
              <p className="flex items-center gap-1 text-[15px] font-bold">
                Pear Pay <VerifiedBadge />
              </p>
              <p className="text-[11px] text-[#71767b]">@PearPay</p>
            </div>
            <div className="ml-auto text-[18px] text-[#e7e9ea]">ⓘ</div>
          </div>
        </div>

        {/* DM thread */}
        <div
          ref={threadRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto bg-black px-3 py-3"
        >
          <div className="mx-auto flex flex-col items-center gap-1 py-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16181c] text-2xl">
              🍐
            </span>
            <p className="flex items-center gap-1 text-[15px] font-bold text-white">
              Pear Pay <VerifiedBadge />
            </p>
            <p className="text-[12px] text-[#71767b]">@PearPay · Pay anyone on X</p>
          </div>
          {messages.map((m) => (
            <XMessage
              key={m.id}
              msg={m}
              active={m.id === flowId}
              phase={phase}
              onConfirm={confirm}
            />
          ))}
        </div>

        {/* Input */}
        <div className="z-20 flex shrink-0 items-center gap-2 border-t border-[#2f3336] bg-black px-3 py-2">
          <span className="text-xl text-[#1d9bf0]">＋</span>
          <div className="flex min-h-9 flex-1 items-center rounded-2xl bg-[#202327] px-3 py-1.5 text-[15px] text-white">
            {draft ? (
              <span className="break-words">
                {draft}
                <span className="pp-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-[#1d9bf0]" />
              </span>
            ) : (
              <span className="text-[#71767b]">Start a message</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Send"
            onClick={handleSend}
            disabled={!hasText || phase !== "idle"}
            className={`text-lg font-bold ${hasText && phase === "idle" ? "text-[#1d9bf0]" : "text-[#1d9bf0]/40"}`}
          >
            ➤
          </button>
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
        DM the verified @PearPay account. “Send 50 USDC to @molly” gets a
        confirmation card; confirm to drop the settled payment into the
        conversation.
      </p>
    </div>
  );
}

function XMessage({
  msg,
  active,
  phase,
  onConfirm,
}: {
  msg: Msg;
  active: boolean;
  phase: Phase;
  onConfirm: () => void;
}) {
  const me = msg.from === "me";

  if (msg.kind === "card" && msg.pay) {
    return (
      <div className="flex justify-start">
        <div className="pp-anim-bubble w-[82%]">
          <PearPayCard pay={msg.pay} />
        </div>
      </div>
    );
  }

  if (msg.kind === "review" && msg.pay) {
    const p = msg.pay;
    return (
      <div className="flex justify-start">
        <div className="pp-anim-bubble w-[82%] overflow-hidden rounded-2xl border border-[#2f3336] bg-[#16181c]">
          <div className="px-3.5 py-3">
            <p className="text-[13px] font-bold text-[#1d9bf0]">🍐 Pear Pay</p>
            <p className="mt-1 text-[15px] text-[#e7e9ea]">
              Send{" "}
              <b>{p.outcome === "private" ? "a private amount" : formatAmount(p)}</b>{" "}
              to <b>{p.recipientLabel}</b>?
            </p>
            <p className="mt-0.5 text-[12px] text-[#71767b]">
              {p.outcome === "claimable"
                ? "They'll get a claim link · settles in USDC"
                : "Routes via Arc · settles in USDC"}
            </p>
          </div>
          {active && phase === "review" ? (
            <button
              type="button"
              onClick={onConfirm}
              className="block w-full border-t border-[#2f3336] py-2.5 text-center text-[15px] font-bold text-[#1d9bf0]"
            >
              Confirm payment
            </button>
          ) : active && phase === "processing" ? (
            <div className="border-t border-[#2f3336] py-2.5 text-center text-[13px] text-[#71767b]">
              ⏳ Sending…
            </div>
          ) : (
            <div className="border-t border-[#2f3336] py-2.5 text-center text-[13px] text-[#71767b]">
              ✓ Confirmed
            </div>
          )}
        </div>
      </div>
    );
  }

  // plain text bubble
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`pp-anim-bubble max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${
          me
            ? "rounded-br-md bg-[#1d9bf0] text-white"
            : "rounded-bl-md bg-[#2f3336] text-[#e7e9ea]"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

function VerifiedBadge() {
  return (
    <svg width="15" height="15" viewBox="0 0 22 22" aria-label="Verified" className="inline">
      <path
        fill="#1d9bf0"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.273 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
      />
    </svg>
  );
}
