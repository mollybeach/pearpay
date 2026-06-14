import type { Metadata } from "next";
import { PayPlayground } from "../components/PayPlayground";

export const metadata: Metadata = {
  title: "Try Pear Pay — Send real USDC on-chain",
  description:
    "Connect a wallet and send real testnet USDC on Arc Testnet, or type a payment in plain English and watch Pear Pay resolve, route, and settle.",
};

export default function PayPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Send <span className="text-pear-400">real</span> money
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-cream/70">
          Two ways to pay with Pear Pay — fire off a real on-chain USDC transfer,
          or just say it like a text and watch it resolve, route, and settle.
        </p>
      </div>

      <div className="mt-10">
        <PayPlayground />
      </div>
    </main>
  );
}
