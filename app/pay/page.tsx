import type { Metadata } from "next";
import { PaymentDemo } from "../components/PaymentDemo";

export const metadata: Metadata = {
  title: "Try Pear Pay — Send a payment with a sentence",
  description:
    "Type a payment in plain English and watch Pear Pay resolve the recipient, pick a settlement rail, and settle in USDC.",
};

export default function PayPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Send money like a <span className="text-pear-400">text</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/70">
          Type a payment in plain English. Pear Pay resolves the recipient,
          picks the optimal settlement rail, and settles in USDC — instantly for
          existing users, or as a claimable link for everyone else.
        </p>
      </div>

      <div className="mt-10">
        <PaymentDemo />
      </div>

      <p className="mt-10 text-center text-xs text-cream/40">
        Demo runs against the live API in sandbox mode. No real funds move.
      </p>
    </main>
  );
}
