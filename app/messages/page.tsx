import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iMessage Payment UX — Pear Pay",
  description:
    "See how sending a payment works right inside iMessage — type it like a text, confirm with Apple Pay, settle in USDC.",
};

/**
 * Messages page — embeds the self-contained iMessage payment UX storyboard
 * (served statically from /public) inside the app shell so it sits behind the
 * site header and nav like any other page.
 */
export default function MessagesPage() {
  return (
    <main className="w-full">
      <iframe
        src="/imessage-payment-ux.html"
        title="Pear Pay — iMessage payment UX"
        className="h-[calc(100vh-4rem)] w-full border-0"
      />
    </main>
  );
}
