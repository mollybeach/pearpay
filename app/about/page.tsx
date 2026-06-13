import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — Pear Pay",
  description:
    "Pear Pay is a conversational payment protocol that turns natural language into secure, private, chain-abstracted USDC transactions — for humans and AI agents.",
};

const STACK = [
  { name: "Dynamic", role: "Embedded, server & agent wallets" },
  { name: "ENS", role: "Human-readable identity & agent discovery" },
  { name: "Hedera", role: "Primary settlement rail — HTS, HBAR & HCS audit" },
  { name: "Arc", role: "Circle-native USDC settlement & liquidity" },
  { name: "Unlink", role: "Private balances, transfers & claims" },
  { name: "Twilio", role: "SMS / WhatsApp claim links, Verify & Voice" },
];

const PROBLEMS = [
  "Create a wallet & secure a seed phrase",
  "Understand networks & choose a chain",
  "Acquire gas tokens & copy addresses",
  "Bridge assets, swap tokens & confirm",
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      {/* Intro */}
      <div className="flex flex-col items-center text-center">
        <Image
          src="/PearPayLogo.png"
          alt="Pear Pay logo"
          width={120}
          height={120}
          className="h-28 w-28 object-contain drop-shadow-[0_0_40px_rgba(116,179,39,0.35)]"
        />
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
          About <span className="text-pear-400">Pear Pay</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-cream/75">
          Pear Pay is a conversational payment protocol that lets you send money
          anywhere you communicate. It transforms natural language into secure,
          private, and chain-abstracted blockchain transactions.
        </p>
      </div>

      {/* Mission */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Our mission</h2>
        <p className="mt-4 leading-relaxed text-cream/75">
          The best payment products let people pay people — not wallets. Users
          think about friends, family, coworkers, and creators, not blockchain
          addresses, networks, or gas fees. Pear Pay focuses on human
          relationships and the channels people already use, becoming the
          payment infrastructure layer for both human communication and the
          emerging agentic economy.
        </p>
      </section>

      {/* Problem */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">The problem</h2>
        <p className="mt-4 leading-relaxed text-cream/75">
          Despite years of progress, sending crypto still forces mainstream
          users to:
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {PROBLEMS.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-pear-900/40 px-4 py-3 text-sm text-cream/80"
            >
              <span className="mt-0.5 text-pear-400">✗</span>
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-5 leading-relaxed text-cream/75">
          It’s confusing and error-prone — nothing like the experience people
          expect from Apple Pay, Venmo, or Cash App. Pear Pay removes every one
          of these steps.
        </p>
      </section>

      {/* Solution */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">The solution</h2>
        <p className="mt-4 leading-relaxed text-cream/75">
          Instead of navigating financial infrastructure, users simply express
          intent — “Pay Alex back for dinner,” “Split the Airbnb with everyone,”
          “Send Sarah 50 USDC privately.” Behind the scenes Pear Pay resolves
          identities, creates wallets, routes across chains, settles in USDC, and
          optionally protects privacy. Payments never fail because a recipient
          hasn’t onboarded — funds wait securely in a claimable escrow until
          they’re ready.
        </p>
      </section>

      {/* Tech stack */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold">Built with</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {STACK.map((s) => (
            <div
              key={s.name}
              className="rounded-xl border border-white/10 bg-pear-900/40 p-5"
            >
              <p className="font-semibold text-pear-300">{s.name}</p>
              <p className="mt-1 text-sm text-cream/65">{s.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business card / share */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">Pear Pay at a glance</h2>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 shadow-glow">
          <Image
            src="/pearpaybusinesscard.png"
            alt="Pear Pay — The Apple Pay of Web3. Built at ETHGlobal NYC 2026."
            width={1200}
            height={630}
            className="h-auto w-full"
          />
        </div>
        <p className="mt-3 text-center text-xs text-cream/45">
          Built at ETHGlobal NYC 2026
        </p>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center">
        <Link
          href="/#waitlist"
          className="inline-block rounded-xl bg-pear-500 px-8 py-3 font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400"
        >
          Join the waitlist
        </Link>
      </section>
    </main>
  );
}
