"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONTACT,
  formatAmount,
  parsePayment,
  QUICK_PHRASES,
  type PayInfo,
} from "@/lib/imessage";

/**
 * Interactive iMessage payment playground.
 *
 * A self-contained, screen-recordable iOS Messages simulator: type a payment
 * with the on-screen keyboard (or your physical keyboard), tap send, confirm in
 * a faux Apple Pay sheet with Face ID, and watch a Pear Pay payment card drop
 * into the thread. Everything is simulated client-side so the demo is instant
 * and never depends on backend credentials. Parsing/formatting live in
 * `@/lib/imessage` so they can be unit-tested.
 */

type Side = "in" | "out";
type Phase = "idle" | "sheet" | "scanning" | "approved";
type KbMode = "letters" | "numbers" | "symbols";

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

/* ----------------------------- keyboard data ----------------------------- */

const LETTER_ROWS = [
  "qwertyuiop".split(""),
  "asdfghjkl".split(""),
  "zxcvbnm".split(""),
];
const NUMBER_ROWS = [
  "1234567890".split(""),
  ["-", "/", ":", ";", "(", ")", "$", "&", "@", '"'],
  [".", ",", "?", "!", "'"],
];
const SYMBOL_ROWS = [
  ["[", "]", "{", "}", "#", "%", "^", "*", "+", "="],
  ["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"],
  [".", ",", "?", "!", "'"],
];

let msgId = 100;
const nextId = () => ++msgId;

export function IMessageSimulator() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [draft, setDraft] = useState("Send Molly $20");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<PayInfo | null>(null);
  const [mode, setMode] = useState<KbMode>("letters");
  const [shift, setShift] = useState(true);

  const threadRef = useRef<HTMLDivElement>(null);

  const pushMsg = useCallback((m: Omit<Msg, "id">) => {
    setMessages((prev) => [...prev, { ...m, id: nextId() }]);
  }, []);

  // Keep the conversation scrolled to the newest message.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, phase]);

  const handleSend = useCallback(() => {
    if (phase !== "idle") return;
    const text = draft.trim();
    if (!text) return;

    const pay = parsePayment(text);
    if (pay) {
      setPending(pay);
      setDraft("");
      setShift(true);
      setPhase("sheet");
      return;
    }

    pushMsg({ side: "out", kind: "text", text });
    setDraft("");
    setShift(true);
  }, [draft, phase, pushMsg]);

  // Physical-keyboard support so the demo can be typed quickly.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase !== "idle") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setDraft((d) => d.slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSend();
      } else if (e.key.length === 1) {
        e.preventDefault();
        setDraft((d) => d + e.key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, handleSend]);

  function press(key: string) {
    if (phase !== "idle") return;
    switch (key) {
      case "shift":
        setShift((s) => !s);
        return;
      case "123":
        setMode("numbers");
        return;
      case "ABC":
        setMode("letters");
        return;
      case "#+=":
        setMode("symbols");
        return;
      case "del":
        setDraft((d) => d.slice(0, -1));
        return;
      case "space":
        setDraft((d) => d + " ");
        return;
      case "return":
        handleSend();
        return;
      case "globe":
        return;
      default: {
        const ch = mode === "letters" && shift ? key.toUpperCase() : key;
        setDraft((d) => d + ch);
        if (mode === "letters" && shift) setShift(false);
      }
    }
  }

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
    setMode("letters");
    setShift(true);
  }

  const sheetOpen = phase !== "idle";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Quick scenario phrases */}
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PHRASES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              if (phase === "idle") {
                setDraft(p);
                setShift(false);
              }
            }}
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

      {/* iPhone */}
      <div className="relative h-[812px] w-[375px] rounded-[3.2rem] bg-black p-[11px] shadow-[0_30px_80px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
        {/* side button */}
        <span className="absolute -right-[3px] top-[170px] h-16 w-[3px] rounded-r bg-zinc-700" />
        <span className="absolute -left-[3px] top-[150px] h-10 w-[3px] rounded-l bg-zinc-700" />
        <span className="absolute -left-[3px] top-[200px] h-16 w-[3px] rounded-l bg-zinc-700" />

        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.6rem] bg-black">
          {/* Status bar + Dynamic Island */}
          <div className="relative z-30 flex h-11 shrink-0 items-center justify-between px-7 pt-2 text-[13px] font-semibold text-white">
            <span className="tabular-nums">9:41</span>
            <span className="absolute left-1/2 top-2 h-[26px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
            <span className="flex items-center gap-1.5">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </span>
          </div>

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
            className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3"
          >
            <p className="py-1 text-center text-[10px] text-white/35">
              <span className="font-semibold text-white/45">iMessage</span> · Today
              9:41 AM
            </p>
            {messages.map((m) =>
              m.kind === "pay" && m.pay ? (
                <PayCard key={m.id} pay={m.pay} />
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
              onClick={() => {
                if (phase === "idle") {
                  setDraft("Send Molly $20");
                  setShift(false);
                }
              }}
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
            {QUICK_PHRASES.slice(0, 3).map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  if (phase === "idle") {
                    setDraft(p);
                    setShift(false);
                  }
                }}
                className={`flex-1 truncate px-2 py-2 text-center ${
                  i > 0 ? "border-l border-white/10" : ""
                }`}
              >
                {p.replace(/^Send /, "")}
              </button>
            ))}
          </div>

          {/* Keyboard */}
          <Keyboard mode={mode} shift={shift} onPress={press} />

          {/* Home indicator */}
          <div className="flex shrink-0 justify-center bg-[#161618] pb-1.5 pt-1">
            <span className="h-1 w-32 rounded-full bg-white/30" />
          </div>

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
        </div>
      </div>

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

function PayCard({ pay }: { pay: PayInfo }) {
  const badge =
    pay.outcome === "settled"
      ? { text: "SETTLED ✅", cls: "bg-pear-500/20 text-pear-300" }
      : pay.outcome === "private"
        ? { text: "PRIVATE 🕶️", cls: "bg-zinc-400/25 text-zinc-100" }
        : { text: "CLAIMABLE ⏳", cls: "bg-amber-500/20 text-amber-300" };

  const amount = pay.outcome === "private" ? "$ • • •" : formatAmount(pay);
  const toLine =
    pay.outcome === "private" ? (
      <>
        To <b className="text-cream">• • • • •</b> · amount hidden
      </>
    ) : pay.outcome === "claimable" ? (
      <>
        To <b className="text-cream">{pay.recipientName}</b> · not on Pear Pay yet
      </>
    ) : (
      <>
        You paid <b className="text-cream">{pay.recipientLabel}</b>
      </>
    );

  return (
    <div className="flex justify-end">
      <div className="pp-anim-pop w-[80%] rounded-[18px] rounded-br-[5px] border border-pear-500/35 bg-gradient-to-b from-[#16301a] to-[#0a1f12] p-3.5 shadow-[0_8px_24px_-6px_rgba(116,179,39,0.3)]">
        <div className="flex items-center justify-between">
          <span className="text-[22px] leading-none">🍐</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}
          >
            {badge.text}
          </span>
        </div>
        <p className="mt-2 text-[28px] font-extrabold tracking-tight text-cream">
          {amount}
        </p>
        <p className="text-[13px] text-cream/70">{toLine}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Tag className="bg-violet-500/20 text-violet-200">🟣 Hedera</Tag>
          {pay.outcome === "private" ? (
            <Tag className="bg-zinc-400/20 text-zinc-100">🕶️ Unlink</Tag>
          ) : (
            <Tag>USDC</Tag>
          )}
          <Tag>
            {pay.outcome === "claimable"
              ? "escrowed"
              : pay.outcome === "private"
                ? "shielded"
                : "instant"}
          </Tag>
        </div>
        {pay.outcome === "claimable" ? (
          <p className="mt-2.5 rounded-lg bg-black/30 px-2.5 py-1.5 font-mono text-[11px] text-pear-200">
            claim → pearpay.app/claim/abc123
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Tag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        className || "bg-white/8 text-cream/75"
      }`}
    >
      {children}
    </span>
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

/* ------------------------------- keyboard -------------------------------- */

function Keyboard({
  mode,
  shift,
  onPress,
}: {
  mode: KbMode;
  shift: boolean;
  onPress: (key: string) => void;
}) {
  const rows =
    mode === "letters"
      ? LETTER_ROWS
      : mode === "numbers"
        ? NUMBER_ROWS
        : SYMBOL_ROWS;
  const [row1 = [], row2 = [], row3 = []] = rows;

  const leftToggle = mode === "letters" ? "123" : "ABC";
  const row3Left = mode === "letters" ? "shift" : mode === "numbers" ? "#+=" : "123";

  return (
    <div className="z-20 shrink-0 select-none bg-[#161618] px-1.5 pb-1.5 pt-2.5">
      {/* Row 1 */}
      <div className="mb-1.5 flex justify-center gap-[5px]">
        {row1.map((k) => (
          <Key key={k} label={mode === "letters" && shift ? k.toUpperCase() : k} onPress={() => onPress(k)} />
        ))}
      </div>

      {/* Row 2 */}
      <div className="mb-1.5 flex justify-center gap-[5px] px-3">
        {row2.map((k) => (
          <Key key={k} label={mode === "letters" && shift ? k.toUpperCase() : k} onPress={() => onPress(k)} />
        ))}
      </div>

      {/* Row 3 */}
      <div className="mb-1.5 flex items-stretch justify-center gap-[5px]">
        <Key
          wide
          dark
          onPress={() => onPress(row3Left)}
          label={
            row3Left === "shift" ? (
              <ShiftIcon active={shift} />
            ) : (
              <span className="text-[13px]">{row3Left}</span>
            )
          }
        />
        <div className="flex flex-1 justify-center gap-[5px]">
          {row3.map((k) => (
            <Key key={k} label={mode === "letters" && shift ? k.toUpperCase() : k} onPress={() => onPress(k)} />
          ))}
        </div>
        <Key wide dark onPress={() => onPress("del")} label={<DeleteIcon />} />
      </div>

      {/* Row 4 */}
      <div className="flex items-stretch gap-[5px]">
        <Key wide dark grow={1.6} onPress={() => onPress(leftToggle)} label={<span className="text-[13px]">{leftToggle}</span>} />
        <Key dark onPress={() => onPress("globe")} label={<GlobeIcon />} />
        <Key grow={5} onPress={() => onPress("space")} label={<span className="text-[14px] text-white/80">space</span>} />
        <Key grow={2} dark onPress={() => onPress("return")} label={<span className="text-[14px]">return</span>} />
      </div>
    </div>
  );
}

function Key({
  label,
  onPress,
  wide = false,
  dark = false,
  grow,
}: {
  label: React.ReactNode;
  onPress: () => void;
  wide?: boolean;
  dark?: boolean;
  grow?: number;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={grow ? { flexGrow: grow, flexBasis: 0 } : undefined}
      className={`pp-key flex h-[42px] items-center justify-center rounded-[6px] text-[18px] text-white shadow-[0_1px_0_rgba(0,0,0,0.5)] transition active:opacity-70 ${
        dark ? "bg-[#3a3a3c]" : "bg-[#6b6b6f]"
      } ${wide ? "min-w-[42px] px-2.5" : grow ? "" : "min-w-[30px] flex-1"}`}
    >
      {label}
    </button>
  );
}

/* --------------------------------- icons --------------------------------- */

function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="white" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 12" fill="white" aria-hidden>
      <path d="M8 2.3c2.5 0 4.8 1 6.5 2.6l-1.4 1.5A7 7 0 0 0 8 4.3a7 7 0 0 0-5.1 2.1L1.5 4.9A9.4 9.4 0 0 1 8 2.3Z" />
      <path d="M8 6c1.4 0 2.7.6 3.7 1.5l-1.5 1.6A2.9 2.9 0 0 0 8 8.1c-.8 0-1.6.4-2.2 1L4.3 7.5A5.3 5.3 0 0 1 8 6Z" />
      <circle cx="8" cy="10.4" r="1.4" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden>
      <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" fill="none" stroke="white" strokeOpacity="0.4" />
      <rect x="2" y="2" width="17" height="9" rx="2" fill="white" />
      <rect x="23" y="4" width="2" height="5" rx="1" fill="white" fillOpacity="0.5" />
    </svg>
  );
}
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
function ShiftIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill={active ? "white" : "none"} stroke="white" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M10 2.5 18 10h-4v6H6v-6H2l8-7.5Z" />
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg width="22" height="18" viewBox="0 0 24 18" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M8 2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8L1 9l7-7Z" />
      <path d="M16 6.5 11 11.5M11 6.5l5 5" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.4" aria-hidden>
      <circle cx="10" cy="10" r="8" />
      <path d="M2 10h16M10 2c2.5 2.2 2.5 13.8 0 16M10 2c-2.5 2.2-2.5 13.8 0 16" />
    </svg>
  );
}
