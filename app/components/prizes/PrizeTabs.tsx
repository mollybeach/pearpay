"use client";

import { useState } from "react";

/**
 * Prize-pool showcase tabs (modeled on HedgePod's per-prize implementation
 * pages, rebuilt as in-page tabs in the Pear Pay theme). Each tab documents how
 * Pear Pay satisfies one ETHGlobal track — the bounty asks, what we built, code
 * evidence, and why we should win — using the project's real integrations.
 */

interface Item {
  icon: string;
  title: string;
  body: string;
}
interface Evidence {
  file: string;
  desc: string;
  code: string;
}
interface Metric {
  icon: string;
  label: string;
  sub: string;
}
interface CTA {
  label: string;
  href: string;
  primary?: boolean;
}
interface Prize {
  id: string;
  label: string;
  icon: string;
  title: string;
  subtitle: string;
  amount: string;
  intro: string;
  asks?: Item[];
  built: Item[];
  evidence: Evidence[];
  why: Item[];
  metrics: Metric[];
  ctas: CTA[];
}

const PRIZES: Prize[] = [
  {
    id: "finalist",
    label: "Finalist",
    icon: "🏆",
    title: "Pear Pay — Finalist Submission",
    subtitle:
      "Turn Conversations Into Transactions — the universal payment layer for messaging, social apps, and AI agents.",
    amount: "ETHGlobal NYC 2026 · Top Finalist",
    intro:
      "Pear Pay turns natural language into secure, private, chain-abstracted USDC payments — anywhere you communicate. One deposit, no addresses, no chain selection, no gas. It integrates six sponsors at production depth (Arc, Dynamic, Unlink, Hedera, ENS, Twilio) behind a single message.",
    built: [
      { icon: "💬", title: "Natural-Language Payments", body: "An NLP core turns “Send Molly $20” into an executable payment — recipient, rail, amount, privacy — with zero crypto jargon." },
      { icon: "📱", title: "3 Live Chat Playgrounds", body: "Fully interactive, screen-recordable iMessage, Telegram, and Discord simulators with on-screen keyboards and in-app confirmation flows." },
      { icon: "🔗", title: "Claimable Payments + Escrow", body: "Pay anyone — even with no wallet. Funds escrow in USDC and release on claim, solving the crypto cold-start problem." },
      { icon: "🪪", title: "Human-Readable Identity", body: "ENS resolution for people and agents — pay molly.eth or pearpay-agent.eth, never 0x4E2B5C…" },
      { icon: "🕶️", title: "Private by Default", body: "Optional shielded transfers hide balances, amounts, and counterparties via Unlink — privacy as a feature, not a premium." },
      { icon: "🤖", title: "Agentic Economy", body: "AI agents pay APIs and each other autonomously via Dynamic server wallets and x402 — machine-to-machine commerce settled in USDC." },
    ],
    evidence: [
      { file: "src/core/payments/orchestrator.ts", desc: "The single brain: parses intent, resolves the recipient, picks a rail, settles, and notifies.", code: "processMessage(message, sender, { channel })" },
      { file: "src/core/nlp/parser.ts", desc: "Natural-language → structured intent (amount, recipient, privacy, split).", code: "parseIntent(\"Send Molly $20\")" },
      { file: "src/core/escrow/service.ts", desc: "Smart escrow for claimable payments: escrow on send, release on claim, refund on expiry.", code: "escrow() · claim() · refundExpired()" },
      { file: "app/components/{IMessage,Telegram,Discord}Simulator.tsx", desc: "Three interactive in-chat payment playgrounds sharing one tested foundation.", code: "<ChannelPlayground />" },
      { file: "contracts/PearPayEscrow.sol", desc: "On-chain conditional escrow with time-based refunds, deployed to EVM rails.", code: "function claim(bytes32 id) / refund()" },
    ],
    why: [
      { icon: "✅", title: "Deep multi-sponsor integration", body: "Arc, Dynamic, Unlink, Hedera, ENS, and Twilio wired at production depth — not logo-dropping." },
      { icon: "✅", title: "Consumer-grade UX", body: "Three live chat playgrounds with native keyboards and in-app confirmation — no 0x addresses, no jargon." },
      { icon: "✅", title: "Solves the cold-start problem", body: "Claimable payments + Twilio reach recipients who have no wallet yet. The payment never blocks on onboarding." },
      { icon: "✅", title: "Production engineering", body: "Typed TypeScript core, 40 passing unit tests, an orchestrator + serializer, and a deployed escrow contract." },
      { icon: "✅", title: "Built for the agentic economy", body: "Human → agent → agent commerce via x402 and Dynamic server wallets, settled in USDC." },
    ],
    metrics: [
      { icon: "🌐", label: "8+ Channels", sub: "iMessage, Telegram, Discord, Slack, WhatsApp, SMS, Voice, Agents" },
      { icon: "🤝", label: "6 Sponsors", sub: "Arc · Dynamic · Unlink · Hedera · ENS · Twilio" },
      { icon: "🧪", label: "40 Tests", sub: "Typed core, all passing" },
    ],
    ctas: [
      { label: "▶ Try the chat playground", href: "/messages", primary: true },
      { label: "💸 Send a payment", href: "/pay" },
      { label: "💻 GitHub", href: "https://github.com/mollybeach/pearpay" },
    ],
  },
  {
    id: "arc",
    label: "Arc",
    icon: "🔵",
    title: "Arc — Best Stablecoin Apps",
    subtitle:
      "The purpose-built L1 from Circle — the Economic OS for the internet. Pear Pay uses Arc as its USDC settlement and liquidity hub.",
    amount: "$15,000 Partner Prize",
    intro:
      "Arc is Pear Pay's settlement and liquidity layer. Every conversational payment ultimately settles in USDC on Arc, and our smart-escrow gives advanced, multi-step stablecoin logic — escrow on send, conditional release on claim, automatic time-based refunds.",
    asks: [
      { icon: "🧠", title: "Advanced Stablecoin Logic", body: "Smart contracts with conditional flows, on-chain automation, or multi-step settlement in USDC/EURC." },
      { icon: "🔗", title: "Chain-Abstracted USDC", body: "Treat multiple chains as one liquidity surface, using Arc to move USDC wherever it's needed." },
      { icon: "📦", title: "Functional MVP", body: "Working frontend + backend, architecture diagram, demo video, and a public GitHub repo." },
    ],
    built: [
      { icon: "💵", title: "USDC Settlement Layer", body: "settleUsdc() routes and settles every payment in USDC, with per-chain USDC addresses resolved automatically." },
      { icon: "⏳", title: "Conditional Multi-Step Escrow", body: "PearPayEscrow.sol holds funds on send and releases on claim — advanced programmable stablecoin logic, not a plain transfer." },
      { icon: "🌍", title: "Chain Abstraction", body: "Users never choose a chain or token; Arc is the single liquidity surface behind every conversational payment." },
      { icon: "🤖", title: "Agentic USDC Payments", body: "x402 lets agents pay for APIs and settle in USDC autonomously — stablecoin-native machine commerce." },
    ],
    evidence: [
      { file: "src/integrations/arc/index.ts", desc: "USDC settlement: per-chain USDC addresses + the settle entrypoint returning an on-chain receipt.", code: "USDC_ADDRESSES · usdcAddress() · settleUsdc(): SettlementReceipt" },
      { file: "contracts/PearPayEscrow.sol", desc: "Conditional, multi-step USDC settlement: escrow → claim/refund with time-based expiry.", code: "claim(bytes32 id) · refund() · expiresAt" },
      { file: "src/core/payments/settlement.ts", desc: "Selects the rail and settles in USDC, abstracting chains behind a single result.", code: "settle(leg) → { rail: \"arc\", txHash }" },
      { file: "app/api/x402/pay/route.ts", desc: "HTTP 402 agentic payment endpoint settling USDC for API access.", code: "POST /api/x402/pay" },
    ],
    why: [
      { icon: "✅", title: "Advanced stablecoin logic", body: "Conditional escrow with automatic release and time-based refunds — not a one-shot transfer." },
      { icon: "✅", title: "Multi-step settlement", body: "Escrow on send, release on claim — a programmable USDC flow across the payment lifecycle." },
      { icon: "✅", title: "One liquidity surface", body: "Conversational payments hide all cross-chain complexity; Arc settles every transfer in USDC." },
      { icon: "✅", title: "Complete MVP", body: "Working frontend + backend, escrow contract, and an architecture diagram in the README." },
    ],
    metrics: [
      { icon: "💵", label: "100% USDC", sub: "Every payment settles in USDC" },
      { icon: "⏳", label: "Conditional Escrow", sub: "Release on claim · refund on expiry" },
      { icon: "🌍", label: "Chain-Abstracted", sub: "Users never pick a chain" },
    ],
    ctas: [
      { label: "▶ See a USDC settlement", href: "/messages", primary: true },
      { label: "💻 View the escrow contract", href: "https://github.com/mollybeach/pearpay/blob/main/contracts/PearPayEscrow.sol" },
    ],
  },
  {
    id: "dynamic",
    label: "Dynamic",
    icon: "⚡",
    title: "Dynamic — Wallets, Flow & Agents",
    subtitle:
      "Embedded, server, and agent wallets with sub-second signing. Pear Pay uses Dynamic for onboarding, signing, Fireblocks Flow, and autonomous agents.",
    amount: "$10,000 Partner Prize",
    intro:
      "Dynamic powers Pear Pay's entire wallet layer: instant embedded-wallet onboarding on claim, server wallets for autonomous agents, and Fireblocks Flow to accept any token on any chain and settle in USDC — abstracting away swap-and-bridge.",
    asks: [
      { icon: "🌊", title: "Best Use of Flow", body: "Accept stablecoins/crypto from any wallet, exchange, or chain and settle in the token of your choice." },
      { icon: "🤖", title: "Best Agentic Build", body: "Agents that transact, settle, and operate autonomously via server wallets, delegated access, and Flow." },
      { icon: "🏅", title: "Best Overall + Joint Nanopayments", body: "Open track for the best product; plus the joint private-nanopayments prize with Unlink & Arc." },
    ],
    built: [
      { icon: "🔑", title: "Instant Wallet on Claim", body: "createEmbeddedWallet() spins up a wallet the moment a new recipient claims — no seed phrase, no app download." },
      { icon: "🤖", title: "Server & Agent Wallets", body: "createAgentWallet() + an AgentWalletService give AI agents wallets that sign and execute 24/7 with no popups." },
      { icon: "🌊", title: "Fireblocks Flow Settlement", body: "A FlowClient quotes, prepares, signs, and broadcasts cross-chain — pay from any token, settle in USDC." },
      { icon: "🔌", title: "x402 Autonomous Payments", body: "Agents pay APIs through HTTP 402 / x402 using their Dynamic server wallet — agent-to-agent commerce." },
    ],
    evidence: [
      { file: "src/components/Providers.tsx", desc: "Wraps the app in Dynamic's context provider for login + embedded-wallet UX.", code: "<DynamicContextProvider settings={{ environmentId }}>" },
      { file: "src/integrations/dynamic/index.ts", desc: "Embedded + agent wallet creation and Pear Pay user lookup.", code: "createEmbeddedWallet() · createAgentWallet() · lookupPearPayUser()" },
      { file: "src/integrations/flow/client.ts", desc: "Fireblocks Flow client: quote → prepare → sign → broadcast cross-chain.", code: "class FlowClient { quote() · start() · broadcast() }" },
      { file: "src/core/agents/wallet.ts", desc: "Autonomous agent service that initializes a server wallet and runs intents.", code: "class AgentWalletService { runIntent() }" },
      { file: "app/api/agent/* · app/api/flow/payment/*", desc: "Endpoints for agent initialize/run-intent and the Flow quote/prepare/broadcast lifecycle.", code: "POST /api/agent/run-intent · /api/flow/payment/start" },
    ],
    why: [
      { icon: "✅", title: "Full wallet stack", body: "Login, embedded onboarding, server wallets, and agent wallets — all on Dynamic." },
      { icon: "✅", title: "Flow abstracts swap+bridge", body: "Recipients are paid from any token on any chain and settle in USDC in one flow." },
      { icon: "✅", title: "True agent autonomy", body: "Server wallets + x402 let agents transact 24/7 with no wallet popups." },
      { icon: "✅", title: "Removes the cold-start barrier", body: "Instant wallet creation on claim means the payment never blocks on onboarding." },
    ],
    metrics: [
      { icon: "🔑", label: "0-Seed Onboarding", sub: "Wallet created on claim" },
      { icon: "🌊", label: "Any → USDC", sub: "Fireblocks Flow settlement" },
      { icon: "🤖", label: "24/7 Agents", sub: "Server wallets + x402" },
    ],
    ctas: [
      { label: "▶ Run the autonomous agent", href: "/", primary: true },
      { label: "🔗 Claim flow", href: "/messages" },
      { label: "💻 GitHub", href: "https://github.com/mollybeach/pearpay" },
    ],
  },
  {
    id: "unlink",
    label: "Unlink",
    icon: "🕶️",
    title: "Unlink — Private Nanopayments",
    subtitle:
      "The embedded privacy SDK — private balances, transfers, and DeFi access on the EVM chains users already use. Pear Pay makes privacy a default, not a premium.",
    amount: "$5,000 Partner Prize",
    intro:
      "Add “privately” to any message and Pear Pay routes the transfer through Unlink so balances, amounts, and counterparties stay hidden. Combined with Dynamic (wallets) and Arc (settlement), it delivers private nanopayments for AI inference and pay-per-request APIs.",
    asks: [
      { icon: "🔐", title: "Use a Private Primitive", body: "Integrate @unlink-xyz/sdk and use at least one of deposit(), transfer(), withdraw(), or execute()." },
      { icon: "🪙", title: "Best Private Nano Payment App", body: "Joint with Dynamic & Arc: wallet creation + private routing + high-throughput settlement." },
      { icon: "📹", title: "Working Private Demo", body: "A demo showing the flow running privately, a public repo, and a README explaining what is now private." },
    ],
    built: [
      { icon: "🕶️", title: "Shielded Transfers", body: "privateTransfer() routes payments so the amount and counterparty are hidden — surfaced as the “PRIVATE 🕶️” card in every channel." },
      { icon: "🔒", title: "Private Claimable Payments", body: "Claim links where the amount and recipient stay confidential — a creative private use case." },
      { icon: "🏦", title: "Private Balances", body: "deposit() and withdraw() move funds in and out of private accounts via the Unlink primitives." },
      { icon: "🤖", title: "Private Nanopayments", body: "Joint Dynamic + Unlink + Arc flow: private micropayments for AI inference and pay-per-request APIs." },
    ],
    evidence: [
      { file: "src/integrations/unlink/index.ts", desc: "Unlink private primitives wrapping the SDK.", code: "deposit() · privateTransfer() · withdraw()" },
      { file: "src/lib/unlink.ts", desc: "Shields a payment so amount and counterparty are hidden before settlement.", code: "shieldPayment(): ShieldResult" },
      { file: "app/api/privacy/shield/route.ts", desc: "Backend endpoint that runs a transfer through Unlink privately.", code: "POST /api/privacy/shield" },
      { file: "ChannelPlayground (PRIVATE card)", desc: "“Send Sasha 50 USDC privately” renders a masked, shielded payment card in-thread.", code: "outcome: \"private\" → 🕶️ Unlink · shielded" },
    ],
    why: [
      { icon: "✅", title: "Privacy is built-in", body: "Just add “privately” — no separate app, no premium tier. Balances, amounts, and counterparties stay hidden." },
      { icon: "✅", title: "Real private primitive", body: "Uses Unlink deposit()/transfer()/withdraw() on a real payments flow, not a toy." },
      { icon: "✅", title: "Joint Dynamic + Arc", body: "Wallet creation (Dynamic) + private routing (Unlink) + USDC settlement (Arc) = private nanopayments." },
      { icon: "✅", title: "Creative use case", body: "Private claimable payments where even the recipient and amount are confidential." },
    ],
    metrics: [
      { icon: "🕶️", label: "Hidden by Default", sub: "Amount + counterparty shielded" },
      { icon: "🤝", label: "Dynamic + Arc", sub: "Joint private-nanopayments stack" },
      { icon: "🤖", label: "AI Nanopayments", sub: "Private pay-per-request APIs" },
    ],
    ctas: [
      { label: "▶ Send privately", href: "/messages", primary: true },
      { label: "💻 GitHub", href: "https://github.com/mollybeach/pearpay" },
    ],
  },
];

export function PrizeTabs() {
  const [active, setActive] = useState(PRIZES[0]!.id);
  const prize = PRIZES.find((p) => p.id === active) ?? PRIZES[0]!;

  return (
    <div className="flex flex-col gap-8">
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Prize tracks"
        className="mx-auto flex flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-pear-900/50 p-1"
      >
        {PRIZES.map((p) => {
          const on = p.id === active;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => setActive(p.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition sm:px-5 ${
                on
                  ? "bg-pear-500 text-pear-950 shadow-glow"
                  : "text-cream/70 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <span aria-hidden className="mr-1.5">
                {p.icon}
              </span>
              {p.label}
            </button>
          );
        })}
      </div>

      <PrizePanel prize={prize} />
    </div>
  );
}

function PrizePanel({ prize }: { prize: Prize }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-pear-500/30 bg-pear-500/10 px-4 py-1.5 text-sm font-semibold text-pear-300">
          {prize.icon} {prize.amount}
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {prize.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-cream/70">{prize.subtitle}</p>
      </div>

      {/* Intro */}
      <Card>
        <p className="text-cream/85">{prize.intro}</p>
      </Card>

      {/* What the bounty asks */}
      {prize.asks ? (
        <Card title="🎯 What the bounty asks" accent="amber">
          <div className="space-y-3">
            {prize.asks.map((a) => (
              <Bullet key={a.title} icon={a.icon} title={a.title}>
                {a.body}
              </Bullet>
            ))}
          </div>
        </Card>
      ) : null}

      {/* What we built */}
      <Card title="✅ What we built">
        <div className="grid gap-4 sm:grid-cols-2">
          {prize.built.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-white/10 bg-pear-950/40 p-4"
            >
              <div className="text-2xl">{b.icon}</div>
              <h4 className="mt-2 font-semibold">{b.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-cream/65">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        {prize.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-white/10 bg-pear-900/40 p-5 text-center"
          >
            <div className="text-3xl">{m.icon}</div>
            <div className="mt-2 font-bold">{m.label}</div>
            <div className="mt-0.5 text-xs text-cream/55">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Code evidence */}
      <Card title="📝 Code evidence">
        <div className="space-y-3">
          {prize.evidence.map((e) => (
            <div
              key={e.file}
              className="rounded-xl border border-white/10 bg-pear-950/50 p-4"
            >
              <p className="font-mono text-sm font-semibold text-pear-300">
                📁 {e.file}
              </p>
              <p className="mt-1 text-sm text-cream/70">{e.desc}</p>
              <code className="mt-2 block break-words rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-pear-200">
                {e.code}
              </code>
            </div>
          ))}
        </div>
      </Card>

      {/* Why we should win */}
      <Card title="🏆 Why we should win" accent="pear">
        <div className="space-y-3">
          {prize.why.map((w) => (
            <Bullet key={w.title} icon={w.icon} title={w.title}>
              {w.body}
            </Bullet>
          ))}
        </div>
      </Card>

      {/* CTAs */}
      <div className="flex flex-wrap justify-center gap-3">
        {prize.ctas.map((c) => {
          const external = c.href.startsWith("http");
          const cls = c.primary
            ? "rounded-xl bg-pear-500 px-6 py-3 font-semibold text-pear-950 shadow-glow transition hover:bg-pear-400"
            : "rounded-xl border border-white/10 px-6 py-3 font-semibold text-cream transition hover:bg-white/5";
          return external ? (
            <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className={cls}>
              {c.label}
            </a>
          ) : (
            <a key={c.label} href={c.href} className={cls}>
              {c.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  title,
  accent,
  children,
}: {
  title?: string;
  accent?: "amber" | "pear";
  children: React.ReactNode;
}) {
  const ring =
    accent === "amber"
      ? "border-amber-500/25 bg-amber-500/[0.06]"
      : accent === "pear"
        ? "border-pear-500/25 bg-pear-500/[0.06]"
        : "border-white/10 bg-pear-900/40";
  return (
    <div className={`rounded-2xl border p-6 ${ring}`}>
      {title ? (
        <h3 className="mb-4 text-xl font-bold sm:text-2xl">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}

function Bullet({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-xl">{icon}</span>
      <p className="text-sm leading-relaxed text-cream/80">
        <span className="font-semibold text-cream">{title}:</span> {children}
      </p>
    </div>
  );
}
