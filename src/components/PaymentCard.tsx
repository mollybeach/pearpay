import { formatRecipient, type PaymentPayload } from "@/lib/payload";

interface PaymentCardProps {
  payload: PaymentPayload;
  compact?: boolean;
}

export function PaymentCard({ payload, compact = false }: PaymentCardProps) {
  const recipient = formatRecipient(payload);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/30 bg-white/20 shadow-2xl backdrop-blur-xl ${
        compact ? "p-6" : "p-8"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-blue-500/10" />
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            PearPay
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2775CA] text-xs font-bold text-white">
            $
          </div>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Amount</p>
          <p
            className={`font-semibold tracking-tight text-zinc-900 ${compact ? "text-3xl" : "text-5xl"}`}
          >
            {payload.amount.toFixed(2)}{" "}
            <span className="text-2xl text-zinc-500">{payload.token}</span>
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">To</p>
          <p className="text-lg font-medium capitalize text-zinc-800">
            {recipient}
          </p>
          {payload.recipient_type === "phone" && (
            <p className="mt-1 text-xs text-amber-600">
              SMS claim link will be sent
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Arc Testnet · Flow cross-chain · Unlink shielded
        </div>
      </div>
    </div>
  );
}
