import type { Metadata } from "next";
import { ChannelPlayground } from "../components/ChannelPlayground";

export const metadata: Metadata = {
  title: "Chat Payment Playground — Pear Pay",
  description:
    "Interactive iMessage, Telegram, and Discord simulators: type a payment, confirm in-app, and watch it settle in USDC — exactly the in-chat Pear Pay experience.",
};

/**
 * Messages page — a fully interactive, screen-recordable payment playground
 * across iMessage, Telegram, and Discord (real on-screen keyboard, in-app
 * confirmation flows, animated payment cards).
 */
export default function MessagesPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          The chat payment <span className="text-pear-400">playground</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-cream/70">
          Send money the way it actually feels inside your chats — iMessage,
          Telegram, or Discord. Type it like a text, confirm in-app, and watch
          Pear Pay settle in USDC. Live, clickable, and ready to screen-record.
        </p>
      </div>

      <div className="mt-10">
        <ChannelPlayground />
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
