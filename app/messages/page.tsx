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
    <main className="relative min-h-[calc(100vh-4rem)] bg-[#1e1e1e]">
      {/* Neutral gray backdrop covering the full viewport (behind the sticky
          header too) so screen recordings of the simulator don't show the
          pear-green site branding. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[#1e1e1e]"
      />
      <div className="mx-auto max-w-5xl px-5 py-12">
        <ChannelPlayground />

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
      </div>
    </main>
  );
}
