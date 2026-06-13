import { formatAmount, type PayInfo } from "@/lib/imessage";

/**
 * The Pear Pay payment card shown inside a chat thread once a payment settles.
 * Shared by the iMessage and Telegram playgrounds (Discord renders its own
 * native-style embed instead).
 */
export function PearPayCard({ pay }: { pay: PayInfo }) {
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
    <div className="pp-anim-pop w-full rounded-[18px] border border-pear-500/35 bg-gradient-to-b from-[#16301a] to-[#0a1f12] p-3.5 shadow-[0_8px_24px_-6px_rgba(116,179,39,0.3)]">
      <div className="flex items-center justify-between">
        <span className="text-[22px] leading-none">🍐</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
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
  );
}

export function Tag({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        className || "bg-white/10 text-cream/75"
      }`}
    >
      {children}
    </span>
  );
}
