import Image from "next/image";
import Link from "next/link";
import { AgentDemo } from "@/components/AgentDemo";
import { WaitlistForm } from "./components/WaitlistForm";
import { ARC_CHAIN_ID, ARC_EURC_ADDRESS, ARC_USDC_ADDRESS } from "@/lib/constants";

const FEATURES = [
  {
    icon: "💬",
    title: "Natural Language Payments",
    body: "Just say what you want — “Send Molly $20.” No addresses, no chain selection, no blockchain expertise.",
  },
  {
    icon: "🔗",
    title: "Chain Abstraction",
    body: "Never pick a chain or token again. Pear Pay routes and settles on the optimal rail automatically.",
  },
  {
    icon: "💵",
    title: "USDC Settlement",
    body: "Every payment settles in USDC for stable value, fast finality, and global reach.",
  },
  {
    icon: "🕶️",
    title: "Private Transfers",
    body: "Optionally hide balances, amounts, and counterparties. Privacy is built in, not a premium.",
  },
  {
    icon: "🪪",
    title: "Human-Readable Identity",
    body: "Pay molly.eth instead of 0x4E2B5C… ENS identities for people and AI agents alike.",
  },
  {
    icon: "🤖",
    title: "AI Agent Commerce",
    body: "Agents pay for APIs, compute, and each other — autonomous machine-to-machine payments.",
  },
];

const CHANNELS = [
  { label: "iMessage", icon: "💬" },
  { label: "Telegram", icon: "✈️" },
  { label: "WhatsApp", icon: "🟢" },
  { label: "Discord", icon: "🎮" },
  { label: "Slack", icon: "💼" },
  { label: "AI Agents", icon: "🤖" },
];

const STEPS = [
  {
    n: "1",
    title: "Say it",
    body: "Type “Pay Alex $125 for the Airbnb” in any chat — or ask an AI agent.",
  },
  {
    n: "2",
    title: "We resolve & route",
    body: "Pear Pay finds the recipient, picks the best rail, and settles in USDC.",
  },
  {
    n: "3",
    title: "They get paid",
    body: "Existing users get funds instantly; new ones claim via a secure link.",
  },
];

const ARC_HUB_DETAILS = [
  { label: "Settlement hub", value: `Arc Testnet (${ARC_CHAIN_ID})` },
  { label: "USDC", value: ARC_USDC_ADDRESS },
  { label: "EURC", value: ARC_EURC_ADDRESS },
  { label: "Routing", value: "Source chain -> Arc -> recipient" },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Soft light glow behind the hero logo */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-pear-300/25 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 pb-20 pt-16 text-center sm:pt-24">
          <div className="rounded-[2rem] bg-gradient-to-b from-white to-pear-50 p-5 shadow-glow ring-1 ring-white/40 sm:p-6">
            <Image
              src="/PearPayLogo.png"
              alt="Pear Pay logo"
              width={180}
              height={180}
              priority
              className="h-32 w-32 object-contain sm:h-40 sm:w-40"
            />
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
            Turn Conversations
            <br />
            Into <span className="text-pear-400">Transactions</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-cream/75 sm:text-xl">
            The Apple Pay of Web3. Send money anywhere you communicate — from
            messaging apps to AI agents. One conversation. One payment.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/pay"
              className="rounded-xl bg-pear-500 px-6 py-3 font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400"
            >
              Try the demo
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-white/10 px-6 py-3 font-semibold text-cream transition hover:bg-white/5"
            >
              Learn more
            </Link>
          </div>

          {/* Demo message bubble */}
          <div className="mt-12 w-full max-w-sm rounded-2xl border border-white/10 bg-pear-900/60 p-4 text-left shadow-glow">
            <p className="text-xs uppercase tracking-wider text-cream/40">
              You
            </p>
            <p className="mt-1 rounded-xl bg-pear-500/15 px-4 py-2 font-medium text-cream">
              “Send Molly $20”
            </p>
            <p className="mt-3 text-xs uppercase tracking-wider text-cream/40">
              Pear Pay 🍐
            </p>
            <p className="mt-1 rounded-xl bg-white/5 px-4 py-2 text-cream/90">
              Sent $20 to molly.eth. Settled in USDC ✅
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Pay people, not wallets
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-cream/65">
          Pear Pay handles wallets, chains, bridges, swaps, and gas — so users
          only ever express intent.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-pear-900/40 p-6 transition hover:border-pear-500/40 hover:bg-pear-900/60"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Channels */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-center text-2xl font-bold">
          If you can send a message, you can send money
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {CHANNELS.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-pear-900/50 px-5 py-2.5 text-sm font-medium"
            >
              <span aria-hidden>{c.icon}</span>
              {c.label}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          How it works
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-white/10 bg-pear-900/40 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pear-500 font-bold text-pear-950">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Arc settlement */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-3xl border border-pear-500/25 bg-pear-900/50 p-8 shadow-glow">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-pear-300">
            Arc USDC liquidity hub
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">
                One payment surface across chains
              </h2>
              <p className="mt-4 max-w-2xl text-cream/70">
                Pear Pay keeps chain choice out of the conversation. The backend
                detects the sender&apos;s source chain, routes USDC through Arc, and
                settles claimable payments with programmable escrow: funds lock on
                send, release on claim, and refund after expiry.
              </p>
            </div>
            <div className="grid gap-3">
              {ARC_HUB_DETAILS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-pear-950/70 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-cream/40">
                    {item.label}
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-cream/90">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Agent demo */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Agentic economy
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-cream/65">
          Humans approve with Face ID. Agents pay APIs autonomously via Dynamic
          server wallets and x402.
        </p>
        <div className="mt-8 flex justify-center">
          <AgentDemo />
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="mx-auto max-w-4xl px-5 py-20">
        <div className="rounded-3xl border border-pear-500/30 bg-gradient-to-b from-pear-900/80 to-pear-950 p-10 text-center shadow-glow">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-white to-pear-50 p-2 ring-1 ring-white/40">
            <Image
              src="/PearPayLogo.png"
              alt="Pear Pay"
              width={64}
              height={64}
              className="h-12 w-12 object-contain"
            />
          </span>
          <h2 className="mt-4 text-3xl font-bold">Send money like a text</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/70">
            Be first to turn your conversations into transactions. Join the
            waitlist and we’ll reach out when Pear Pay is ready.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </main>
  );
}
