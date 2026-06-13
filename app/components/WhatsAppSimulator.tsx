"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatAmount, parsePayment, type PayInfo } from "@/lib/imessage";
import { HomeIndicator, PhoneFrame, StatusBar } from "./playground/PhoneFrame";
import { IosKeyboard, usePhysicalKeyboard } from "./playground/IosKeyboard";
import { PearPayCard } from "./playground/PearPayCard";

/**
 * Interactive WhatsApp payment playground.
 *
 * Message the Pear Pay WhatsApp Business account. Because requests like
 * "Pay Alex back for dinner" carry no amount, the bot replies with quick-reply
 * amount buttons (authentic WhatsApp interactive messages), then confirms and
 * settles — sending a Twilio claim link when the recipient has no wallet yet.
 */

type From = "me" | "bot";
type Phase = "idle" | "amount" | "confirm" | "processing";

interface Msg {
  id: number;
  from: From;
  kind: "text" | "quick" | "confirm" | "card";
  text?: string;
  pay?: PayInfo;
  options?: number[];
  memo?: string;
}

const DEFAULT_RECIPIENT = "Sam";
const QUICK = [
  "Pay Alex back for dinner",
  "Send Sarah $25",
  "Pay mom $50 for groceries",
];
const AMOUNTS = [15, 20, 25];

const INITIAL: Msg[] = [
  {
    id: 1,
    from: "bot",
    kind: "text",
    text: "💚 Pear Pay here. Tell me who to pay — like “Pay Alex back for dinner”.",
  },
];

let mid = 100;
const nextId = () => ++mid;

/** Detect a pay intent that has a recipient + optional memo but no amount. */
function detectNoAmountIntent(text: string): { name: string; memo?: string } | null {
  if (!/\b(send|pay|venmo|transfer)\b/i.test(text)) return null;
  const m =
    text.match(/\b(?:send|pay|venmo|transfer)\s+([a-z][a-z0-9.]*)/i) ||
    text.match(/\bto\s+@?([a-z0-9.]+)/i);
  let name = m?.[1] ?? "";
  if (!name || ["me", "you", "back", "the", "a"].includes(name.toLowerCase())) {
    name = DEFAULT_RECIPIENT;
  }
  const memoMatch = text.match(/\bfor\s+(.+?)[.!?]?$/i);
  return { name, memo: memoMatch?.[1]?.trim() };
}

export function WhatsAppSimulator() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("Pay Alex back for dinner");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<PayInfo | null>(null);
  const [flowId, setFlowId] = useState<number | null>(null);
  const [recipient, setRecipient] = useState<string>("");
  const [memo, setMemo] = useState<string | undefined>(undefined);

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

  function review(pay: PayInfo) {
    setPending(pay);
    window.setTimeout(() => {
      const id = push({ from: "bot", kind: "confirm", pay });
      setFlowId(id);
      setPhase("confirm");
    }, 450);
  }

  const handleSend = useCallback(() => {
    if (phase !== "idle") return;
    const text = draft.trim();
    if (!text) return;
    push({ from: "me", kind: "text", text });
    setDraft("");

    const pay = parsePayment(text, DEFAULT_RECIPIENT);
    if (pay) {
      review(pay);
      return;
    }
    const intent = detectNoAmountIntent(text);
    if (intent) {
      setRecipient(intent.name);
      setMemo(intent.memo);
      window.setTimeout(() => {
        const id = push({
          from: "bot",
          kind: "quick",
          text: `How much should I send ${intent.name}${intent.memo ? ` for ${intent.memo}` : ""}?`,
          options: AMOUNTS,
          memo: intent.memo,
        });
        setFlowId(id);
        setPhase("amount");
      }, 450);
    } else {
      window.setTimeout(() => {
        push({
          from: "bot",
          kind: "text",
          text: "I can send money for you 💸 Try “Pay Alex back for dinner” or “Send Sarah $25”.",
        });
      }, 450);
    }
  }, [draft, phase, push]); // eslint-disable-line react-hooks/exhaustive-deps

  const appendChar = useCallback((ch: string) => setDraft((d) => d + ch), []);
  const backspace = useCallback(() => setDraft((d) => d.slice(0, -1)), []);
  usePhysicalKeyboard({
    enabled: phase === "idle",
    onChar: appendChar,
    onBackspace: backspace,
    onEnter: handleSend,
  });

  function chooseAmount(amount: number) {
    if (phase !== "amount") return;
    push({ from: "me", kind: "text", text: `$${amount}` });
    const pay = parsePayment(`Send ${recipient} $${amount}`, DEFAULT_RECIPIENT);
    if (pay) review(pay);
  }

  function confirmPay() {
    if (phase !== "confirm" || !pending) return;
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
              ? `📲 ${p.recipientName} isn't on Pear Pay yet — I texted them a claim link to grab the ${formatAmount(p)}.`
              : p.outcome === "private"
                ? "🕶️ Sent privately — amount & recipient shielded via Unlink."
                : `✅ Sent ${formatAmount(p)} to ${p.recipientLabel}. Settled in USDC.`,
        });
        setPhase("idle");
        setPending(null);
        setFlowId(null);
      }, 600);
    }, 1300);
  }

  function resetDemo() {
    setMessages(INITIAL);
    setDraft("Pay Alex back for dinner");
    setPhase("idle");
    setPending(null);
    setFlowId(null);
    setRecipient("");
    setMemo(undefined);
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
        <div className="bg-[#075e54]">
          <StatusBar />
          <div className="flex items-center gap-2.5 px-2 pb-2 pt-1 text-white">
            <span className="text-2xl leading-none">‹</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
              🍐
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold">Pear Pay</p>
              <p className="text-[11px] text-white/75">online</p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-[18px]">
              <span>📹</span>
              <span>📞</span>
            </div>
          </div>
        </div>

        {/* Chat (WhatsApp beige wallpaper) */}
        <div
          ref={threadRef}
          className="flex flex-1 flex-col gap-1.5 overflow-y-auto bg-[#e5ddd5] px-3 py-3"
        >
          <div className="mx-auto rounded-md bg-[#d9f6ce] px-3 py-1 text-center text-[11px] text-[#5b6b5b] shadow-sm">
            🔒 Messages are end-to-end encrypted.
          </div>
          {messages.map((m) => (
            <WaMessage
              key={m.id}
              msg={m}
              active={m.id === flowId}
              phase={phase}
              onAmount={chooseAmount}
              onConfirm={confirmPay}
            />
          ))}
        </div>

        {/* Input */}
        <div className="z-20 flex shrink-0 items-center gap-2 bg-[#f0f0f0] px-2 py-2">
          <div className="flex min-h-9 flex-1 items-center gap-2 rounded-full bg-white px-3 py-1.5">
            <span className="text-[#8696a0]">😊</span>
            <div className="flex-1 text-[15px] text-black">
              {draft ? (
                <span className="break-words">
                  {draft}
                  <span className="pp-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-[#25d366]" />
                </span>
              ) : (
                <span className="text-[#8696a0]">Type a message</span>
              )}
            </div>
            <span className="text-[#8696a0]">📎</span>
          </div>
          <button
            type="button"
            aria-label="Send"
            onClick={handleSend}
            disabled={!hasText || phase !== "idle"}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg text-white transition ${
              hasText && phase === "idle" ? "bg-[#25d366]" : "bg-[#25d366]/60"
            }`}
          >
            {hasText ? "➤" : "🎙"}
          </button>
        </div>

        <IosKeyboard
          theme="light"
          onInput={appendChar}
          onDelete={backspace}
          onReturn={handleSend}
        />
        <HomeIndicator className="bg-[#d1d4db]" />
      </PhoneFrame>

      <p className="max-w-sm text-center text-xs text-cream/45">
        Message the Pear Pay business account. “Pay Alex back for dinner” has no
        amount, so the bot asks with quick-reply buttons — then settles and sends
        a claim link if the recipient has no wallet.
      </p>
    </div>
  );
}

function WaMessage({
  msg,
  active,
  phase,
  onAmount,
  onConfirm,
}: {
  msg: Msg;
  active: boolean;
  phase: Phase;
  onAmount: (a: number) => void;
  onConfirm: () => void;
}) {
  const me = msg.from === "me";

  if (msg.kind === "card" && msg.pay) {
    return (
      <div className="flex justify-start">
        <div className="pp-anim-bubble w-[85%]">
          <PearPayCard pay={msg.pay} />
        </div>
      </div>
    );
  }

  if (msg.kind === "quick") {
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="pp-anim-bubble max-w-[82%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-[15px] text-[#111b21] shadow-sm">
          {msg.text}
        </div>
        {active && phase === "amount" ? (
          <div className="flex w-[82%] flex-col overflow-hidden rounded-lg bg-white shadow-sm">
            {(msg.options ?? []).map((a, i) => (
              <button
                key={a}
                type="button"
                onClick={() => onAmount(a)}
                className={`py-2.5 text-center text-[15px] font-medium text-[#027eb5] ${
                  i > 0 ? "border-t border-black/5" : ""
                }`}
              >
                💵 Send ${a}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (msg.kind === "confirm" && msg.pay) {
    const p = msg.pay;
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="pp-anim-bubble max-w-[82%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-[15px] text-[#111b21] shadow-sm">
          Send{" "}
          <b>{p.outcome === "private" ? "a private amount" : formatAmount(p)}</b>{" "}
          to <b>{p.recipientLabel}</b>?
          <span className="mt-0.5 block text-[12px] text-[#667781]">
            {p.outcome === "claimable"
              ? "They'll get a claim link · settles in USDC"
              : "Routes via Hedera → Arc · settles in USDC"}
          </span>
        </div>
        {active && phase === "confirm" ? (
          <button
            type="button"
            onClick={onConfirm}
            className="w-[82%] rounded-lg bg-[#25d366] py-2.5 text-center text-[15px] font-semibold text-white shadow-sm"
          >
            ✅ Confirm &amp; Pay
          </button>
        ) : active && phase === "processing" ? (
          <div className="w-[82%] rounded-lg bg-white py-2.5 text-center text-[13px] text-[#667781] shadow-sm">
            ⏳ Sending…
          </div>
        ) : null}
      </div>
    );
  }

  // plain text
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`pp-anim-bubble max-w-[80%] rounded-lg px-2.5 py-1.5 text-[15px] leading-snug text-[#111b21] shadow-sm ${
          me ? "rounded-tr-none bg-[#dcf8c6]" : "rounded-tl-none bg-white"
        }`}
      >
        {msg.text}
        {me ? (
          <span className="ml-1 align-bottom text-[11px] text-[#34b7f1]">✓✓</span>
        ) : null}
      </div>
    </div>
  );
}
