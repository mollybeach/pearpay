import type { Metadata } from "next";
import { RealPayment } from "../components/RealPayment";
import { PaymentDemo } from "../components/PaymentDemo";

export const metadata: Metadata = {
  title: "Try Pear Pay — Send real USDC on-chain",
  description:
    "Connect a wallet and send real testnet USDC on Arc Testnet, or type a payment in plain English and watch Pear Pay resolve, route, and settle.",
};

export default function PayPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Send <span className="text-pear-400">real</span> money
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/70">
          Connect your wallet and send real USDC on-chain — signed by you,
          broadcast for real, with a verifiable explorer link. Running on Arc
          Testnet so it&apos;s free to try.
        </p>
      </div>

      <div className="mt-10">
        <RealPayment />
      </div>

      {/* The natural-language vision (simulated routing) */}
      <div className="mt-16 border-t border-white/10 pt-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            …or just say it like a <span className="text-pear-400">text</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/65">
            Type a payment in plain English and watch Pear Pay resolve the
            recipient, pick a settlement rail, and settle in USDC.
          </p>
        </div>
        <div className="mt-8">
          <PaymentDemo />
        </div>
        <p className="mt-6 text-center text-xs text-cream/40">
          The natural-language demo runs against the API in sandbox mode.
        </p>
      </div>
    </main>
  );
}
