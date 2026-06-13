"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatAmount, parsePayment, type PayInfo } from "@/lib/imessage";
import { HomeIndicator, PhoneFrame, StatusBar } from "./playground/PhoneFrame";
import { IosKeyboard, usePhysicalKeyboard } from "./playground/IosKeyboard";
import { PearPayCard } from "./playground/PearPayCard";

/**
 * Interactive Telegram payment playground.
 *
 * Chat with the @PearPay bot: send a natural-language payment, the bot replies
 * with an inline-keyboard "Pay" button, a Telegram-style checkout sheet slides
 * up, and the settled Pear Pay card is posted back into the chat. Shares the
 * phone frame, keyboard and payment card with the iMessage/Discord playgrounds.
 */

type From = "me" | "bot";
type Phase = "idle" | "review" | "sheet" | "processing";

interface Msg {
  id: number;
  from: From;
  kind: "text" | "review" | "card";
  text?: string;
  pay?: PayInfo;
}

const CONTACT = "Sasha";
const QUICK = ["Send Sasha $20", "Pay sasha.eth 15 USDC", "Send Jordan $40"];

const INITIAL: Msg[] = [
  {
    id: 1,
    from: "bot",
    kind: "text",
    text: "👋 I'm the Pear Pay bot. Tell me who to pay — e.g. “Send Sasha $20”.",
  },
];

let mid = 100;
const nextId = () => ++mid;

export function TelegramSimulator() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("Send Sasha $20");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<PayInfo | null>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);
  const push = useCallback(
    (m: Omit<Msg, "id">) => {
      const id = nextId();
      setMessages((prev) => [...prev, { ...m, id }]);
      return id;
    },
    [],
  );

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

    const pay = parsePayment(text, CONTACT);
    if (pay) {
      setPending(pay);
      window.setTimeout(() => {
        const id = push({ from: "bot", kind: "review", pay });
        setReviewId(id);
        setPhase("review");
      }, 450);
    } else {
      window.setTimeout(() => {
        push({
          from: "bot",
          kind: "text",
          text: "I can send money for you 💸 Try “Send Sasha $20” or “Pay sasha.eth 15 USDC”.",
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

  function openSheet() {
    if (phase === "review" && pending) setPhase("sheet");
  }
  function cancelReview() {
    setPhase("idle");
    setPending(null);
    setReviewId(null);
    push({ from: "bot", kind: "text", text: "No problem — payment cancelled. ✖️" });
  }
  function pay() {
    if (phase !== "sheet" || !pending) return;
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
              ? `📲 ${p.recipientName} isn't on Pear Pay yet — I texted them a claim link.`
              : p.outcome === "private"
                ? "🕶️ Sent privately — amount & recipient shielded via Unlink."
                : `✅ Sent ${formatAmount(p)} to ${p.recipientLabel}. Settled in USDC.`,
        });
        setPhase("idle");
        setPending(null);
        setReviewId(null);
      }, 600);
    }, 1300);
  }

  function resetDemo() {
    setMessages(INITIAL);
    setDraft("Send Sasha $20");
    setPhase("idle");
    setPending(null);
    setReviewId(null);
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
        <div className="bg-[#3390ec]">
          <StatusBar />
          {/* Telegram chat header */}
          <div className="relative flex items-center gap-2.5 px-3 pb-2 pt-1 text-white">
            <span className="text-2xl leading-none">‹</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
              🍐
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold">Pear Pay</p>
              <p className="text-[11px] text-white/75">bot</p>
            </div>
            <div className="ml-auto flex items-center gap-4 text-[18px]">⋮</div>
          </div>
        </div>

        {/* Chat thread (Telegram light wallpaper) */}
        <div
          ref={threadRef}
          className="relative flex flex-1 flex-col gap-2 overflow-y-auto bg-[#cdd9e6] px-3 py-3"
        >
          <div className="mx-auto rounded-full bg-black/10 px-3 py-0.5 text-[11px] text-[#33506b]">
            Today
          </div>
          {messages.map((m) => (
            <TgMessage
              key={m.id}
              msg={m}
              showButtons={m.id === reviewId}
              phase={phase}
              onPay={openSheet}
              onCancel={cancelReview}
            />
          ))}
        </div>

        {/* Input bar */}
        <div className="z-20 flex shrink-0 items-center gap-2 border-t border-black/10 bg-white px-2.5 py-2">
          <span className="text-2xl leading-none text-[#9aa4ad]">📎</span>
          <div className="flex min-h-9 flex-1 items-center text-[15px] text-black">
            {draft ? (
              <span className="break-words">
                {draft}
                <span className="pp-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-[#3390ec]" />
              </span>
            ) : (
              <span className="text-[#9aa4ad]">Message</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Send"
            onClick={handleSend}
            disabled={!hasText || phase !== "idle"}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition ${
              hasText && phase === "idle"
                ? "bg-[#3390ec] text-white"
                : "text-[#9aa4ad]"
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

        {/* Telegram checkout sheet */}
        {(phase === "sheet" || phase === "processing") && pending ? (
          <>
            <div
              className="pp-anim-dim absolute inset-0 z-40 bg-black/45"
              onClick={phase === "sheet" ? () => setPhase("review") : undefined}
            />
            <TelegramSheet
              pay={pending}
              processing={phase === "processing"}
              onPay={pay}
            />
          </>
        ) : null}
      </PhoneFrame>

      <p className="max-w-sm text-center text-xs text-cream/45">
        Chat the <span className="text-cream/70">@PearPay bot</span>, tap its
        inline <span className="text-cream/70">Pay</span> button, then confirm in
        the checkout sheet. Try{" "}
        <span className="text-cream/70">“Send Jordan $40”</span> for the claimable
        flow.
      </p>
    </div>
  );
}

function TgMessage({
  msg,
  showButtons,
  phase,
  onPay,
  onCancel,
}: {
  msg: Msg;
  showButtons: boolean;
  phase: Phase;
  onPay: () => void;
  onCancel: () => void;
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

  if (msg.kind === "review" && msg.pay) {
    const p = msg.pay;
    return (
      <div className="flex justify-start">
        <div className="pp-anim-bubble w-[80%] overflow-hidden rounded-[14px] rounded-bl-[5px] bg-white shadow-sm">
          <div className="px-3 pb-2 pt-2 text-[14px] text-[#0f0f0f]">
            <p className="font-semibold text-[#229ed9]">🍐 Pear Pay</p>
            <p className="mt-1">
              Send <b>{p.outcome === "private" ? "a private amount" : formatAmount(p)}</b>{" "}
              to <b>{p.recipientLabel}</b>?
            </p>
            <p className="mt-0.5 text-[12px] text-black/45">
              {p.outcome === "claimable"
                ? "They'll get a claim link · settles in USDC"
                : "Routes via Hedera → Arc · settles in USDC"}
            </p>
          </div>
          {showButtons && phase === "review" ? (
            <div className="grid grid-cols-2 gap-px bg-black/10 text-[14px] font-medium">
              <button
                type="button"
                onClick={onPay}
                className="bg-white py-2.5 text-[#3390ec]"
              >
                💸 Pay {formatAmount(p)}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="bg-white py-2.5 text-[#e0533d]"
              >
                ✖️ Cancel
              </button>
            </div>
          ) : (
            <div className="bg-black/[0.03] py-2.5 text-center text-[13px] text-black/45">
              {phase === "idle" ? "✅ Confirmed" : "⏳ Confirming…"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // plain text
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`pp-anim-bubble max-w-[78%] px-3 py-1.5 text-[15px] leading-snug text-[#0f0f0f] shadow-sm ${
          me
            ? "rounded-[14px] rounded-br-[5px] bg-[#effdde]"
            : "rounded-[14px] rounded-bl-[5px] bg-white"
        }`}
      >
        {msg.text}
        {me ? (
          <span className="ml-1 align-bottom text-[11px] text-[#4fae4e]">✓✓</span>
        ) : null}
      </div>
    </div>
  );
}

function TelegramSheet({
  pay,
  processing,
  onPay,
}: {
  pay: PayInfo;
  processing: boolean;
  onPay: () => void;
}) {
  return (
    <div className="pp-anim-sheet absolute inset-x-0 bottom-0 z-50 rounded-t-[14px] bg-white px-4 pb-7 pt-3 text-[#0f0f0f]">
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-black/20" />
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf4fd] text-xl">
          🍐
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold">Pear Pay Checkout</p>
          <p className="text-[12px] text-black/45">Test payment · no real funds</p>
        </div>
      </div>

      <TgRow label="Pay to" value={pay.recipientLabel} />
      <TgRow label="Network" value="Hedera → Arc" />
      <TgRow
        label="Total"
        value={pay.outcome === "private" ? "private amount" : formatAmount(pay)}
        bold
      />

      <button
        type="button"
        onClick={onPay}
        disabled={processing}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#3390ec] py-3.5 text-[16px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-80"
      >
        {processing ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Sending…
          </>
        ) : (
          <>Pay {pay.outcome === "private" ? "privately" : formatAmount(pay)}</>
        )}
      </button>
      <p className="mt-2 text-center text-[11px] text-black/40">
        Powered by Pear Pay · gas &amp; chain handled for you
      </p>
    </div>
  );
}

function TgRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-black/8 py-2.5 text-[14px]">
      <span className="text-black/50">{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
