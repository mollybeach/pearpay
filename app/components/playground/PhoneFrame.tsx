import type { ReactNode } from "react";

/**
 * Shared iPhone chrome for the chat payment playgrounds (iMessage, Telegram,
 * Discord). Renders the bezel, side buttons, Dynamic Island and a flex-column
 * screen; each channel composes its own status bar, header, thread, input and
 * keyboard inside.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[812px] w-[375px] rounded-[3.2rem] bg-black p-[11px] shadow-[0_30px_80px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
      {/* side buttons */}
      <span className="absolute -right-[3px] top-[170px] h-16 w-[3px] rounded-r bg-zinc-700" />
      <span className="absolute -left-[3px] top-[150px] h-10 w-[3px] rounded-l bg-zinc-700" />
      <span className="absolute -left-[3px] top-[200px] h-16 w-[3px] rounded-l bg-zinc-700" />

      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.6rem] bg-black">
        {/* Dynamic Island */}
        <span className="pointer-events-none absolute left-1/2 top-2 z-30 h-[26px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
        {children}
      </div>
    </div>
  );
}

/** iOS status bar (time + signal/wifi/battery). White glyphs; transparent bg. */
export function StatusBar() {
  return (
    <div className="relative z-20 flex h-11 shrink-0 items-center justify-between px-7 pt-2 text-[13px] font-semibold text-white">
      <span className="tabular-nums">9:41</span>
      <span className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}

/** Home indicator pill. Pass a bg class to match the surrounding surface. */
export function HomeIndicator({ className = "bg-[#161618]" }: { className?: string }) {
  return (
    <div className={`flex shrink-0 justify-center pb-1.5 pt-1 ${className}`}>
      <span className="h-1 w-32 rounded-full bg-white/30" />
    </div>
  );
}

/* --------------------------------- icons --------------------------------- */

export function SignalIcon() {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="white" aria-hidden>
      <rect x="0" y="7" width="3" height="4" rx="1" />
      <rect x="4.5" y="5" width="3" height="6" rx="1" />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
      <rect x="13.5" y="0" width="3" height="11" rx="1" />
    </svg>
  );
}
export function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 12" fill="white" aria-hidden>
      <path d="M8 2.3c2.5 0 4.8 1 6.5 2.6l-1.4 1.5A7 7 0 0 0 8 4.3a7 7 0 0 0-5.1 2.1L1.5 4.9A9.4 9.4 0 0 1 8 2.3Z" />
      <path d="M8 6c1.4 0 2.7.6 3.7 1.5l-1.5 1.6A2.9 2.9 0 0 0 8 8.1c-.8 0-1.6.4-2.2 1L4.3 7.5A5.3 5.3 0 0 1 8 6Z" />
      <circle cx="8" cy="10.4" r="1.4" />
    </svg>
  );
}
export function BatteryIcon() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden>
      <rect x="0.5" y="0.5" width="21" height="12" rx="3.5" fill="none" stroke="white" strokeOpacity="0.4" />
      <rect x="2" y="2" width="17" height="9" rx="2" fill="white" />
      <rect x="23" y="4" width="2" height="5" rx="1" fill="white" fillOpacity="0.5" />
    </svg>
  );
}
