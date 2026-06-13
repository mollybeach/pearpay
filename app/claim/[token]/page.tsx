import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getEscrowStore } from "@/core/escrow";
import { formatUsdcDisplay } from "@/lib/money";
import { ClaimButton } from "./claim-button";

export const metadata: Metadata = {
  title: "Claim your money — Pear Pay",
  description: "Someone sent you money through Pear Pay. Claim it in one tap.",
};

/**
 * Public claim page — pearpay.app/claim/:token.
 *
 * A recipient with no wallet lands here from a Twilio SMS/WhatsApp link. The
 * ClaimButton triggers embedded wallet creation (Dynamic) and fund release.
 */
export default async function ClaimPage({
  params,
}: {
  params: { token: string };
}) {
  const payment = await getEscrowStore().getByToken(params.token);
  if (!payment) notFound();

  const claimed = payment.status === "claimed";
  const expired = payment.status === "refunded" || payment.expiresAt <= Date.now();
  const amount = payment.private
    ? "a private amount"
    : formatUsdcDisplay(payment.amount);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-5 py-16 text-center">
      {/* Logo on a light badge so it reads on the dark background */}
      <div className="rounded-3xl bg-gradient-to-b from-white to-pear-50 p-4 shadow-glow ring-1 ring-white/40">
        <Image
          src="/PearPayLogo.png"
          alt="Pear Pay"
          width={120}
          height={120}
          priority
          className="h-20 w-20 object-contain"
        />
      </div>

      <p className="mt-6 text-cream/70">
        <span className="font-semibold text-cream">{payment.senderLabel}</span>{" "}
        sent you
      </p>
      <p className="mt-1 text-5xl font-extrabold tracking-tight">
        {payment.private ? (
          <span className="text-cream/80">🕶️ {amount}</span>
        ) : (
          amount
        )}
      </p>
      {payment.memo ? (
        <p className="mt-2 italic text-cream/60">&ldquo;{payment.memo}&rdquo;</p>
      ) : null}

      {/* Card */}
      <div className="mt-8 w-full rounded-2xl border border-white/10 bg-gradient-to-b from-pear-900/70 to-pear-950 p-6 shadow-glow">
        {claimed ? (
          <div>
            <p className="text-2xl">✅</p>
            <p className="mt-2 font-semibold text-pear-200">
              Claimed — funds are in your wallet
            </p>
          </div>
        ) : expired ? (
          <div>
            <p className="text-2xl">⌛️</p>
            <p className="mt-2 font-semibold text-amber-200">
              This payment has expired
            </p>
            <p className="mt-1 text-sm text-cream/55">
              The funds were returned to the sender.
            </p>
          </div>
        ) : (
          <>
            <ClaimButton token={params.token} />
            <p className="mt-4 text-xs leading-relaxed text-cream/50">
              We&apos;ll create a secure wallet for you automatically — no seed
              phrase, no app download required.
            </p>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-cream/35">Powered by Pear Pay 🍐</p>
    </main>
  );
}
