"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTACT,
  formatAmount,
  parsePayment,
  QUICK_PHRASES,
  type PayInfo,
} from "@/lib/imessage";
import {
  HomeIndicator,
  PhoneFrame,
  StatusBar,
} from "./playground/PhoneFrame";
import { IosKeyboard, usePhysicalKeyboard } from "./playground/IosKeyboard";
import { PearPayCard } from "./playground/PearPayCard";

/**
 * Interactive iMessage payment playground.
 *
 * A self-contained, screen-recordable iOS Messages simulator: type a payment
 * with the on-screen keyboard (or your physical keyboard), tap send, confirm in
 * a faux Apple Pay sheet with Face ID, and watch a Pear Pay payment card drop
 * into the thread. Parsing/formatting live in `@/lib/imessage` and the device
 * chrome/keyboard are shared with the Telegram & Discord playgrounds.
 */

type Side = "in" | "out";
type Phase = "idle" | "sheet" | "scanning" | "approved";

interface Msg {
  id: number;
  side: Side;
  kind: "text" | "pay";
  text?: string;
  pay?: PayInfo;
}

const INITIAL: Msg[] = [
  { id: 1, side: "in", kind: "text", text: "Can you send me $20 for lunch? 🥗" },
  { id: 2, side: "out", kind: "text", text: "yep one sec" },
];

let msgId = 100;
const nextId = () => ++msgId;

export function IMessageSimulator() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("Send Molly $20");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<PayInfo | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);

  const pushMsg = useCallback((m: Omit<Msg, "id">) => {
    setMessages((prev) => [...prev, { ...m, id: nextId() }]);
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  const handleSend = useCallback(() => {
    if (phase !== "idle") return;
    const text = draft.trim();
    if (!text) return;

    const pay = parsePayment(text, CONTACT.name);
    if (pay) {
      setPending(pay);
      setDraft("");
      setPhase("sheet");
      return;
    }
    pushMsg({ side: "out", kind: "text", text });
    setDraft("");
  }, [draft, phase, pushMsg]);

  const appendChar = useCallback((ch: string) => {
    setDraft((d) => d + ch);
  }, []);
  const backspace = useCallback(() => setDraft((d) => d.slice(0, -1)), []);

  usePhysicalKeyboard({
    enabled: phase === "idle",
    onChar: appendChar,
    onBackspace: backspace,
    onEnter: handleSend,
  });

  function confirmPay() {
    if (phase !== "sheet" || !pending) return;
    const p = pending;
    setPhase("scanning");
    window.setTimeout(() => {
      setPhase("approved");
      window.setTimeout(() => {
        setPending(null);
        setPhase("idle");
        pushMsg({ side: "out", kind: "pay", pay: p });
        window.setTimeout(() => {
          pushMsg({
            side: "in",
            kind: "text",
            text:
              p.outcome === "claimable"
                ? "ooo got a text to claim it — opening now! 🙌"
                : p.outcome === "private"
                  ? "received it 🤫 thank you!"
                  : "got it, thank you!! 🙏",
          });
        }, 850);
      }, 700);
    }, 1300);
  }

  function cancelSheet() {
    setPending(null);
    setPhase("idle");
  }

  function resetDemo() {
    setMessages(INITIAL);
    setDraft("Send Molly $20");
    setPending(null);
    setPhase("idle");
  }

  const fill = (text: string) => {
    if (phase === "idle") setDraft(text);
  };
  const sheetOpen = phase !== "idle";

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PHRASES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => fill(p)}
            className="rounded-full border border-white/10 bg-pear-900/50 px-3 py-1.5 text-xs text-cream/75 transition hover:border-pear-500/40 hover:text-cream"
          >
            {p}
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
        <StatusBar />

        {/* Conversation header */}
        <div className="relative z-20 flex shrink-0 flex-col items-center border-b border-white/10 bg-[#0c0c0e]/90 px-4 pb-2.5 pt-1 backdrop-blur">
          <div className="absolute left-3 top-1 flex items-center gap-0.5 text-[#2c7cf6]">
            <span className="text-2xl leading-none">‹</span>
            <span className="-ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2c7cf6] px-1 text-[11px] font-semibold text-white">
              7
            </span>
          </div>
          <div className="absolute right-4 top-2 flex items-center gap-4 text-[#2c7cf6]">
            <VideoIcon />
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#9acd5a] to-[#5a8c2a] text-xl">
            {CONTACT.avatar}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-white">
            {CONTACT.name}
            <span className="text-[10px] text-white/40">›</span>
          </div>
        </div>

        {/* Thread */}
        <div
          ref={threadRef}
          className="flex flex-1 flex-col gap-1.5 overflow-y-auto bg-black px-3 py-3"
        >
          <p className="py-1 text-center text-[10px] text-white/35">
            <span className="font-semibold text-white/45">iMessage</span> · Today
            9:41 AM
          </p>
          {messages.map((m) =>
            m.kind === "pay" && m.pay ? (
              <div key={m.id} className="flex justify-end">
                <div className="w-[80%]">
                  <PearPayCard pay={m.pay} />
                </div>
              </div>
            ) : (
              <Bubble key={m.id} side={m.side}>
                {m.text}
              </Bubble>
            ),
          )}
        </div>

        {/* Composer */}
        <div className="z-20 flex shrink-0 items-end gap-2 bg-[#0c0c0e] px-2.5 pb-1.5 pt-2">
          <button
            type="button"
            aria-label="Apps"
            onClick={() => fill("Send Molly $20")}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3a3a3c] text-xl leading-none text-white/80"
          >
            ＋
          </button>
          <div className="flex min-h-9 flex-1 items-center justify-between rounded-2xl border border-white/15 px-3 py-1.5">
            <span className="break-words text-[15px] leading-tight text-white">
              {draft ? (
                <>
                  {draft}
                  <span className="pp-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-[#2c7cf6]" />
                </>
              ) : (
                <span className="text-white/35">iMessage</span>
              )}
            </span>
          </div>
          <button
            type="button"
            aria-label="Send"
            onClick={handleSend}
            disabled={!draft.trim() || phase !== "idle"}
            className={`mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg transition ${
              draft.trim() && phase === "idle"
                ? "bg-[#2c7cf6] text-white"
                : "bg-[#2c2c2e] text-white/30"
            }`}
          >
            ↑
          </button>
        </div>

        {/* Predictive suggestions */}
        <div className="z-20 flex shrink-0 items-stretch border-y border-white/5 bg-[#1b1b1d] text-[13px] text-white/85">
          {QUICK_PHRASES.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => fill(p)}
              className={`flex-1 truncate px-2 py-2 text-center ${
                i > 0 ? "border-l border-white/10" : ""
              }`}
            >
              {p.replace(/^Send /, "")}
            </button>
          ))}
        </div>

        <IosKeyboard
          theme="dark"
          onInput={appendChar}
          onDelete={backspace}
          onReturn={handleSend}
        />
        <HomeIndicator />

        {/* Apple Pay sheet */}
        {sheetOpen && pending ? (
          <>
            <div
              className="pp-anim-dim absolute inset-0 z-40 bg-black/55"
              onClick={phase === "sheet" ? cancelSheet : undefined}
            />
            <ApplePaySheet
              pay={pending}
              phase={phase}
              onPay={confirmPay}
              onCancel={cancelSheet}
            />
          </>
        ) : null}
      </PhoneFrame>

      <p className="max-w-sm text-center text-xs text-cream/45">
        Type with the keyboard (or your real one), tap{" "}
        <span className="text-cream/70">↑</span>, then confirm with Face ID. Try{" "}
        <span className="text-cream/70">“Send Alex $50”</span> for the claimable
        flow or add <span className="text-cream/70">“privately”</span> for a
        shielded transfer.
      </p>
    </div>
  );
}

/* ------------------------------- subviews -------------------------------- */

function Bubble({ side, children }: { side: Side; children: React.ReactNode }) {
  const out = side === "out";
  return (
    <div className={`flex ${out ? "justify-end" : "justify-start"}`}>
      <div
        className={`pp-anim-bubble max-w-[75%] rounded-[18px] px-3 py-2 text-[15px] leading-snug ${
          out
            ? "rounded-br-[5px] bg-[#2c7cf6] text-white"
            : "rounded-bl-[5px] bg-[#26262a] text-white"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ApplePaySheet({
  pay,
  phase,
  onPay,
  onCancel,
}: {
  pay: PayInfo;
  phase: Phase;
  onPay: () => void;
  onCancel: () => void;
}) {
  const total = formatAmount(pay);
  return (
    <div className="pp-anim-sheet absolute inset-x-0 bottom-0 z-50 rounded-t-[20px] border-t border-white/10 bg-[#1c1c1e] px-4 pb-7 pt-3">
      <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/25" />
      <div className="mb-1 flex items-center gap-1.5 text-[18px] font-bold text-white">
        <AppleLogo /> Pay
        <span className="ml-1 text-[13px] font-medium text-white/45">
          · Pear Pay
        </span>
      </div>

      {phase === "scanning" || phase === "approved" ? (
        <div className="flex flex-col items-center gap-3 py-7">
          {phase === "scanning" ? (
            <>
              <div className="pp-faceid flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white/80">
                <FaceIcon />
              </div>
              <p className="text-[15px] font-semibold text-white">
                Double-Click to Confirm
              </p>
              <p className="text-[12px] text-white/50">Scanning with Face ID…</p>
            </>
          ) : (
            <>
              <div className="pp-anim-pop flex h-16 w-16 items-center justify-center rounded-full bg-[#34c759] text-3xl text-white">
                ✓
              </div>
              <p className="text-[15px] font-semibold text-white">Done</p>
            </>
          )}
        </div>
      ) : (
        <>
          <ApRow label="To" value={pay.recipientLabel} />
          <ApRow label="Pay with" value="Pear Pay · USDC" />
          <ApRow label="Network" value="Hedera → Arc" />
          <div className="flex items-center justify-between py-3.5 text-[17px] font-bold text-white">
            <span>Total</span>
            <span>{total}</span>
          </div>
          <button
            type="button"
            onClick={onPay}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-[16px] font-semibold text-black transition active:scale-[0.98]"
          >
            <FaceIcon dark /> Pay with Face ID
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 w-full py-2 text-center text-[13px] text-white/50"
          >
            Cancel
          </button>
          <p className="mt-1 text-center text-[11px] text-white/40">
            Settles in USDC · gas &amp; chain handled for you
          </p>
        </>
      )}
    </div>
  );
}

function ApRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2.5 text-[14px]">
      <span className="text-white/55">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

/* ------------------------- iMessage-specific icons ------------------------ */

function VideoIcon() {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" fill="currentColor" aria-hidden>
      <rect x="0" y="2" width="15" height="12" rx="3.5" />
      <path d="M16.5 6.5 21 3.5v9l-4.5-3v-3Z" />
    </svg>
  );
}
function AppleLogo() {
  return (
    <svg width="16" height="18" viewBox="0 0 14 17" fill="white" aria-hidden>
      <path d="M11.7 12.9c-.2.6-.5 1.1-.9 1.7-.5.7-1 1.2-1.4 1.4-.6.4-1.2.5-1.9.1-.5-.2-1-.3-1.5-.3s-1 .1-1.6.3c-.6.2-1.1.3-1.5.1-.5-.2-.9-.6-1.4-1.4C-.2 12.9-.6 10.5.3 8.6c.6-1.2 1.5-1.9 2.7-1.9.5 0 1.1.2 1.7.5.5.2.8.4 1 .4.1 0 .5-.1 1.1-.4.6-.3 1.2-.4 1.6-.4 1 .1 1.8.5 2.4 1.3-.9.6-1.4 1.4-1.4 2.4 0 .9.4 1.6 1.1 2.1-.1.3-.2.5-.3.7ZM8.9 1.4c0 .6-.2 1.1-.6 1.6-.5.6-1.1.9-1.7.9 0-.6.2-1.1.6-1.6.2-.3.5-.5.8-.7.3-.2.6-.3.9-.3v.1Z" />
    </svg>
  );
}
function FaceIcon({ dark = false }: { dark?: boolean }) {
  const c = dark ? "black" : "white";
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M2 6V4a2 2 0 0 1 2-2h2M16 2h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M6 20H4a2 2 0 0 1-2-2v-2" />
      <path d="M8 8v1.5M14 8v1.5M11 8v3.5l-1 1M8.5 15c.8.7 1.6 1 2.5 1s1.7-.3 2.5-1" />
    </svg>
  );
}
