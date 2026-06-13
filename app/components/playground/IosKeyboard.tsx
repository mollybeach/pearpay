"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Shared on-screen iOS keyboard for the chat playgrounds. Self-manages
 * letters/numbers/symbols modes and shift; emits resolved characters via
 * `onInput` and exposes delete/return callbacks. Supports light & dark themes
 * so it can sit under iMessage/Discord (dark) or Telegram (light).
 */

type KbMode = "letters" | "numbers" | "symbols";
export type KeyboardTheme = "dark" | "light";

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

const THEMES: Record<
  KeyboardTheme,
  { bg: string; key: string; fn: string; text: string; shadow: string }
> = {
  dark: {
    bg: "bg-[#161618]",
    key: "bg-[#6b6b6f]",
    fn: "bg-[#3a3a3c]",
    text: "text-white",
    shadow: "shadow-[0_1px_0_rgba(0,0,0,0.5)]",
  },
  light: {
    bg: "bg-[#d1d4db]",
    key: "bg-white",
    fn: "bg-[#abb0bb]",
    text: "text-black",
    shadow: "shadow-[0_1px_0_rgba(0,0,0,0.28)]",
  },
};

interface IosKeyboardProps {
  theme?: KeyboardTheme;
  returnLabel?: string;
  disabled?: boolean;
  onInput: (ch: string) => void;
  onDelete: () => void;
  onReturn: () => void;
}

export function IosKeyboard({
  theme = "dark",
  returnLabel = "return",
  disabled = false,
  onInput,
  onDelete,
  onReturn,
}: IosKeyboardProps) {
  const [mode, setMode] = useState<KbMode>("letters");
  const [shift, setShift] = useState(true);
  const t = THEMES[theme];

  const rows =
    mode === "letters"
      ? LETTER_ROWS
      : mode === "numbers"
        ? NUMBER_ROWS
        : SYMBOL_ROWS;
  const [row1 = [], row2 = [], row3 = []] = rows;

  const leftToggle = mode === "letters" ? "123" : "ABC";
  const row3Left =
    mode === "letters" ? "shift" : mode === "numbers" ? "#+=" : "123";

  function press(key: string) {
    if (disabled) return;
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
        onDelete();
        return;
      case "space":
        onInput(" ");
        return;
      case "return":
        onReturn();
        setMode("letters");
        setShift(true);
        return;
      case "globe":
        return;
      default: {
        const ch = mode === "letters" && shift ? key.toUpperCase() : key;
        onInput(ch);
        if (mode === "letters" && shift) setShift(false);
      }
    }
  }

  const cap = (k: string) => (mode === "letters" && shift ? k.toUpperCase() : k);

  return (
    <div className={`z-20 shrink-0 select-none px-1.5 pb-1.5 pt-2.5 ${t.bg}`}>
      {/* Row 1 */}
      <div className="mb-1.5 flex justify-center gap-[5px]">
        {row1.map((k) => (
          <Key key={k} theme={t} label={cap(k)} onPress={() => press(k)} />
        ))}
      </div>

      {/* Row 2 */}
      <div className="mb-1.5 flex justify-center gap-[5px] px-3">
        {row2.map((k) => (
          <Key key={k} theme={t} label={cap(k)} onPress={() => press(k)} />
        ))}
      </div>

      {/* Row 3 */}
      <div className="mb-1.5 flex items-stretch justify-center gap-[5px]">
        <Key
          wide
          fn
          theme={t}
          onPress={() => press(row3Left)}
          label={
            row3Left === "shift" ? (
              <ShiftIcon active={shift} theme={theme} />
            ) : (
              <span className="text-[13px]">{row3Left}</span>
            )
          }
        />
        <div className="flex flex-1 justify-center gap-[5px]">
          {row3.map((k) => (
            <Key key={k} theme={t} label={cap(k)} onPress={() => press(k)} />
          ))}
        </div>
        <Key wide fn theme={t} onPress={() => press("del")} label={<DeleteIcon theme={theme} />} />
      </div>

      {/* Row 4 */}
      <div className="flex items-stretch gap-[5px]">
        <Key wide fn grow={1.6} theme={t} onPress={() => press(leftToggle)} label={<span className="text-[13px]">{leftToggle}</span>} />
        <Key fn theme={t} onPress={() => press("globe")} label={<GlobeIcon theme={theme} />} />
        <Key grow={5} theme={t} onPress={() => press("space")} label={<span className="text-[14px] opacity-80">space</span>} />
        <Key grow={2} fn theme={t} onPress={() => press("return")} label={<span className="text-[14px]">{returnLabel}</span>} />
      </div>
    </div>
  );
}

function Key({
  label,
  onPress,
  theme,
  wide = false,
  fn = false,
  grow,
}: {
  label: ReactNode;
  onPress: () => void;
  theme: (typeof THEMES)[KeyboardTheme];
  wide?: boolean;
  fn?: boolean;
  grow?: number;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      style={grow ? { flexGrow: grow, flexBasis: 0 } : undefined}
      className={`pp-key flex h-[42px] items-center justify-center rounded-[6px] text-[18px] transition active:opacity-70 ${
        theme.text
      } ${theme.shadow} ${fn ? theme.fn : theme.key} ${
        wide ? "min-w-[42px] px-2.5" : grow ? "" : "min-w-[30px] flex-1"
      }`}
    >
      {label}
    </button>
  );
}

/**
 * Bridge a physical keyboard to a composer while `enabled`. Lets the demo be
 * typed fast without popping the OS keyboard over the simulated one.
 */
export function usePhysicalKeyboard({
  enabled,
  onChar,
  onBackspace,
  onEnter,
}: {
  enabled: boolean;
  onChar: (ch: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!enabled || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        onBackspace();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onEnter();
      } else if (e.key.length === 1) {
        e.preventDefault();
        onChar(e.key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onChar, onBackspace, onEnter]);
}

/* ---------------------------- keyboard icons ----------------------------- */

function ShiftIcon({ active, theme }: { active: boolean; theme: KeyboardTheme }) {
  const stroke = theme === "light" ? "black" : "white";
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill={active ? stroke : "none"} stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M10 2.5 18 10h-4v6H6v-6H2l8-7.5Z" />
    </svg>
  );
}
function DeleteIcon({ theme }: { theme: KeyboardTheme }) {
  const stroke = theme === "light" ? "black" : "white";
  return (
    <svg width="22" height="18" viewBox="0 0 24 18" fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M8 2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8L1 9l7-7Z" />
      <path d="M16 6.5 11 11.5M11 6.5l5 5" />
    </svg>
  );
}
function GlobeIcon({ theme }: { theme: KeyboardTheme }) {
  const stroke = theme === "light" ? "black" : "white";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth="1.4" aria-hidden>
      <circle cx="10" cy="10" r="8" />
      <path d="M2 10h16M10 2c2.5 2.2 2.5 13.8 0 16M10 2c-2.5 2.2-2.5 13.8 0 16" />
    </svg>
  );
}
