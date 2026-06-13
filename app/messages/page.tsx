import type { Metadata } from "next";
import { IMessageSimulator } from "../components/IMessageSimulator";

export const metadata: Metadata = {
  title: "iMessage Payment Playground — Pear Pay",
  description:
    "An interactive iMessage simulator: type a payment, confirm with Apple Pay + Face ID, and watch it settle in USDC — exactly the in-chat Pear Pay experience.",
};

/**
 * Messages page — a fully interactive, screen-recordable iMessage payment
 * playground. Replaces the old static storyboard iframe with a live simulator
 * (real on-screen keyboard, Apple Pay sheet, animated payment cards).
 */
export default function MessagesPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          The <span className="text-pear-400">iMessage</span> payment playground
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-cream/70">
          Send money the way it actually feels inside Messages. Type it like a
          text, confirm with Face ID, and watch Pear Pay settle in USDC — live,
          clickable, and ready to screen-record.
        </p>
      </div>

      <div className="mt-10">
        <IMessageSimulator />
      </div>

      <p className="mt-10 text-center text-xs text-cream/40">
        Fully simulated on-device for the demo — no real funds move. Prefer the
        static storyboard?{" "}
        <a
          href="/imessage-payment-ux.html"
          className="text-pear-300 underline-offset-2 hover:underline"
        >
          View the step-by-step version →
        </a>
      </p>
    </main>
  );
}
