"use client";

import { useState } from "react";
import { ESCROW_EXPLORER_URL } from "@/lib/constants";

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
      "Pear Pay turns natural language into secure, private, chain-abstracted USDC payments — anywhere you communicate. One message, no addresses, no chain selection, no gas. Arc, Dynamic, Unlink, and Twilio are wired at production depth behind a single orchestrator, with a live Autonomous Private Agent timeline on the homepage and real on-chain settlement on Arc Testnet.",
    built: [
      { icon: "💬", title: "Natural-Language Payments", body: "An NLP core turns “Send Molly $20 privately” into an executable PaymentIntent — recipient, rail, amount, privacy — with zero crypto jargon." },
      { icon: "📱", title: "6-Channel Simulator", body: "Screen-recordable iMessage, Telegram, Discord, WhatsApp, Slack, and X playgrounds with on-screen keyboards and native confirmation flows." },
      { icon: "💸", title: "Live Try It (Arc Testnet)", body: "/pay connects a browser wallet and sends real Circle testnet USDC on Arc (chain 5042002) with a verifiable Arcscan receipt." },
      { icon: "🔗", title: "Claimable Payments + Escrow", body: "PearPayEscrow.sol is deployed on Arc Testnet. Funds lock on send and release on claim — solving the crypto cold-start problem." },
      { icon: "🤖", title: "Autonomous Private Agent", body: "PrivateAgentRun on the homepage runs Dynamic sign → Unlink shield → Circle Gateway x402 settle on Arc as a live step-by-step timeline." },
      { icon: "📡", title: "Live Telegram Bot", body: "/api/telegram parses payment intents in-chat and replies via the same orchestrator as Twilio SMS/WhatsApp." },
    ],
    evidence: [
      { file: "src/core/payments/orchestrator.ts", desc: "Single brain: parses intent, resolves recipient, picks Arc or Unlink rail, settles, and notifies.", code: "processMessage(message, sender, { channel })" },
      { file: "src/core/nlp/parser.ts", desc: "Natural-language → structured intent (amount, recipient, privacy, split).", code: "parseIntent(\"Send Molly $20 privately\")" },
      { file: "src/components/PrivateAgentRun.tsx", desc: "One-click joint-bounty timeline — each step calls a real backend route.", code: "POST /api/x402/pay → POST /api/privacy/nanopay" },
      { file: "contracts/PearPayEscrow.sol", desc: "Deployed on Arc Testnet — claim-secret release, expiry refund, sender cancel, dispute/arbiter.", code: "escrow() · claim() · refund() · escrowWithArbiter()" },
      { file: "app/api/telegram/route.ts", desc: "Live Telegram bot webhook — inbound intents → orchestrator → in-chat reply.", code: "POST /api/telegram" },
    ],
    why: [
      { icon: "✅", title: "Deep multi-sponsor integration", body: "Arc, Dynamic, Unlink, and Twilio wired at production depth — real x402, delegated access, burner nanopay, not logo-dropping." },
      { icon: "✅", title: "Consumer-grade UX", body: "Six live chat playgrounds plus a real Arc Testnet wallet flow — no 0x addresses, no jargon." },
      { icon: "✅", title: "Solves the cold-start problem", body: "Claimable payments + Twilio reach recipients who have no wallet yet. The payment never blocks on onboarding." },
      { icon: "✅", title: "Production engineering", body: "Typed TypeScript core, 92+ Vitest tests + 15 Foundry contract tests, deployed escrow, and npm run judge:demo proof scripts." },
      { icon: "✅", title: "Built for the agentic economy", body: "Human → agent → agent commerce via x402, Dynamic server wallets, and Delegated Access — settled in USDC on Arc." },
    ],
    metrics: [
      { icon: "🌐", label: "8+ Channels", sub: "iMessage, Telegram, Discord, Slack, WhatsApp, SMS, Voice, Agents" },
      { icon: "🤝", label: "4 Sponsors", sub: "Arc · Dynamic · Unlink · Twilio" },
      { icon: "🧪", label: "107 Tests", sub: "92 Vitest + 15 Foundry" },
    ],
    ctas: [
      { label: "▶ Autonomous Private Agent", href: "/", primary: true },
      { label: "💬 Chat simulator", href: "/messages" },
      { label: "💸 Try it (Arc Testnet)", href: "/pay" },
      { label: "💻 GitHub", href: "https://github.com/mollybeach/pearpay" },
    ],
  },
  {
    id: "arc",
    label: "Arc",
    icon: "🔵",
    title: "Arc — Best Stablecoin Apps",
    subtitle:
      "Circle's Arc Testnet (5042002) is Pear Pay's USDC settlement and liquidity hub — on-chain escrow, live transfers, and gas-free x402 nanopayments.",
    amount: "$15,000 Partner Prize",
    intro:
      "Every conversational payment ultimately settles in USDC on Arc Testnet. PearPayEscrow.sol is live at 0x065484… with conditional claim-secret release, expiry refunds, sender cancel, and optional arbiter dispute resolution. Sub-cent agent payments settle gas-free via the real @circle-fin/x402-batching SDK.",
    asks: [
      { icon: "🧠", title: "Advanced Stablecoin Logic", body: "Smart contracts with conditional flows, on-chain automation, or multi-step settlement in USDC/EURC." },
      { icon: "🔗", title: "Chain-Abstracted USDC", body: "Treat multiple chains as one liquidity surface, using Arc to move USDC wherever it's needed." },
      { icon: "📦", title: "Functional MVP", body: "Working frontend + backend, architecture diagram, demo video, and a public GitHub repo." },
    ],
    built: [
      { icon: "💵", title: "Live USDC on Arc Testnet", body: "settleUsdc() performs real on-chain USDC.transfer() via viem when FUNDER_PRIVATE_KEY is set — chain 5042002, Arcscan receipts." },
      { icon: "⏳", title: "Deployed PearPayEscrow", body: "escrow() locks USDC/EURC on send; claim() releases on secret; refund() after expiry; escrowWithArbiter() for disputes." },
      { icon: "⚡", title: "Gas-Free x402 Nanopayments", body: "BatchFacilitatorClient verify/settle on EIP-3009 at /api/x402/premium/data — sub-cent USDC, zero gas on Arc." },
      { icon: "🌍", title: "Circle Gateway Bridge", body: "/api/arc/bridge mints USDC onto Arc from a cross-chain unified balance — chain abstraction without a user-facing chain picker." },
    ],
    evidence: [
      { file: "contracts/PearPayEscrow.sol", desc: "Deployed on Arc Testnet — conditional escrow, time-based refund, cancel, dispute/arbiter.", code: "escrow(bytes32,address,uint256,uint64,bytes32) · claim() · refund()" },
      { file: "src/integrations/arc/index.ts", desc: "Live Arc settlement via viem when credentials are set.", code: "settleUsdc(req): SettlementReceipt { txHash }" },
      { file: "src/integrations/arc/x402-gateway.ts", desc: "Real Circle Gateway x402 — BatchFacilitatorClient + GatewayClient on eip155:5042002.", code: "verifyAndSettle() · agentGatewayPay()" },
      { file: "app/api/x402/premium/data/route.ts", desc: "HTTP 402 paywall — returns accepts[], verifies X-Payment, settles gas-free on Arc.", code: "GET /api/x402/premium/data" },
      { file: "app/api/x402/premium/escrow-gated/data/route.ts", desc: "x402 settle → on-chain PearPayEscrow escrow → claim cycle.", code: "GET /api/x402/premium/escrow-gated/data" },
      { file: "src/integrations/arc/gateway-bridge.ts", desc: "Circle Gateway unified balance → mint USDC on Arc.", code: "gatewayChainName(84532) → \"baseSepolia\"" },
    ],
    why: [
      { icon: "✅", title: "Advanced stablecoin logic", body: "Conditional escrow with claim-secret release, expiry refund, cancel, and arbiter dispute — not a one-shot transfer." },
      { icon: "✅", title: "Live on Arc Testnet", body: "Contract deployed and verifiable on Arcscan; npm run verify:arc proves escrow + claim txs." },
      { icon: "✅", title: "Real x402 settlement", body: "Gas-free sub-cent USDC via @circle-fin/x402-batching — judges can open settlementTx on testnet.arcscan.app." },
      { icon: "✅", title: "One liquidity surface", body: "Users never pick a chain; Arc settles every transfer in USDC while Gateway bridge handles cross-chain liquidity." },
    ],
    metrics: [
      { icon: "💵", label: "100% USDC", sub: "Every payment settles in USDC" },
      { icon: "📜", label: "Live Contract", sub: "PearPayEscrow on Arc Testnet" },
      { icon: "⚡", label: "Gas-Free x402", sub: "Sub-cent batched settlement" },
    ],
    ctas: [
      { label: "▶ See a USDC settlement", href: "/pay", primary: true },
      { label: "🔍 View escrow on Arcscan", href: ESCROW_EXPLORER_URL },
      { label: "💻 Escrow contract", href: "https://github.com/mollybeach/pearpay/blob/main/contracts/PearPayEscrow.sol" },
    ],
  },
  {
    id: "dynamic",
    label: "Dynamic",
    icon: "⚡",
    title: "Dynamic — Wallets, Flow & Agents",
    subtitle:
      "Embedded, server, and delegated MPC wallets. Pear Pay uses Dynamic for onboarding, Fireblocks Flow, Delegated Access, and autonomous x402 agents.",
    amount: "$10,000 Partner Prize",
    intro:
      "Dynamic powers Pear Pay's entire wallet layer: instant embedded-wallet onboarding on claim, server wallets for autonomous agents, Delegated Access (Face ID once → backend signs via sealed MPC key shares), and Fireblocks Flow to accept any token on any chain and settle USDC on Arc.",
    asks: [
      { icon: "🌊", title: "Best Use of Flow", body: "Accept stablecoins/crypto from any wallet, exchange, or chain and settle in the token of your choice." },
      { icon: "🤖", title: "Best Agentic Build", body: "Agents that transact, settle, and operate autonomously via server wallets, delegated access, and Flow." },
      { icon: "🏅", title: "Best Overall + Joint Nanopayments", body: "Open track for the best product; plus the joint private-nanopayments prize with Unlink & Arc." },
    ],
    built: [
      { icon: "🔑", title: "Instant Wallet on Claim", body: "createEmbeddedWallet() spins up a wallet the moment a new recipient claims — no seed phrase, no app download." },
      { icon: "🪪", title: "Delegated Access", body: "Face ID/WebAuthn once → Dynamic POSTs encrypted key shares to /api/webhooks/dynamic → server signs autonomously within spend bounds." },
      { icon: "🌊", title: "Fireblocks Flow Settlement", body: "Full 8-step checkout via /api/flow/payment/* — quote, prepare, sign, broadcast, webhook — any token → USDC on Arc." },
      { icon: "🤖", title: "Autonomous x402 Agents", body: "Server wallet (/api/agent/autonomous-pay) or delegated MPC wallet (/api/agent/delegated-pay) pays HTTP 402 paywalls without per-call popups." },
    ],
    evidence: [
      { file: "src/components/Providers.tsx", desc: "Dynamic + Wagmi providers; SSR-safe mount gate before Dynamic hooks run.", code: "<DynamicContextProvider> · mounted gate" },
      { file: "src/components/PrivateAgentRun.tsx", desc: "Homepage one-click timeline — Dynamic signs authorization, then Unlink + Arc settle.", code: "POST /api/x402/pay → POST /api/privacy/nanopay" },
      { file: "src/integrations/dynamic/delegated-wallet.ts", desc: "RSA-decrypt key shares, seal at rest, autonomous delegatedSignMessage.", code: "ingestDelegation() · delegatedSignMessageForWallet()" },
      { file: "app/api/webhooks/dynamic/route.ts", desc: "HMAC-verified webhook for wallet.delegation.created events.", code: "POST /api/webhooks/dynamic" },
      { file: "src/integrations/flow/client.ts", desc: "Fireblocks Flow client: create → source → quote → prepare → broadcast.", code: "FlowClient · /api/flow/payment/*" },
      { file: "app/api/agent/delegated-pay/route.ts", desc: "Agent pays x402 via delegated MPC wallet — full agentic loop.", code: "POST /api/agent/delegated-pay" },
    ],
    why: [
      { icon: "✅", title: "Full wallet stack", body: "Login, embedded onboarding, server wallets, delegated MPC, and agent wallets — all on Dynamic." },
      { icon: "✅", title: "Delegated Access in production", body: "One Face ID grant → backend signs x402 autonomously. Judges see it on the homepage PrivateAgentRun timeline." },
      { icon: "✅", title: "Flow abstracts swap+bridge", body: "Recipients are paid from any token on any chain and settle in USDC in one Flow checkout." },
      { icon: "✅", title: "True agent autonomy", body: "Server + delegated wallets + x402 let agents transact 24/7 with no wallet popups after initial grant." },
    ],
    metrics: [
      { icon: "🔑", label: "0-Seed Onboarding", sub: "Wallet created on claim" },
      { icon: "🪪", label: "Delegated Access", sub: "Face ID once → auto-sign" },
      { icon: "🤖", label: "24/7 Agents", sub: "Server + delegated x402" },
    ],
    ctas: [
      { label: "▶ Autonomous Private Agent", href: "/", primary: true },
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
      "Real @unlink-xyz/sdk on Arc Testnet — shielded balances, private transfers, and ephemeral burner EOAs for unlinkable x402 nanopayments.",
    amount: "$5,000 Partner Prize",
    intro:
      "Add “privately” to any message and Pear Pay routes through Unlink's deposit/transfer/withdraw primitives. For the joint Dynamic + Unlink + Arc prize, POST /api/privacy/nanopay shields USDC into a single-use burner that pays via Circle Gateway x402 on Arc — the chain never links user → seller.",
    asks: [
      { icon: "🔐", title: "Use a Private Primitive", body: "Integrate @unlink-xyz/sdk and use at least one of deposit(), transfer(), withdraw(), or execute()." },
      { icon: "🪙", title: "Best Private Nano Payment App", body: "Joint with Dynamic & Arc: wallet creation + private routing + high-throughput settlement." },
      { icon: "📹", title: "Working Private Demo", body: "A demo showing the flow running privately, a public repo, and a README explaining what is now private." },
    ],
    built: [
      { icon: "🕶️", title: "Shielded Transfers", body: "privateTransfer() via createUnlinkClient hides amount and counterparty — surfaced as the “PRIVATE 🕶️” card in every channel simulator." },
      { icon: "🔥", title: "Ephemeral Burner Nanopay", body: "privateNanopayment(): shielded pool → single-use burner EOA → gas-free x402 on Arc → dispose key. Payer on Arcscan is the burner, not the user." },
      { icon: "🏦", title: "Live SDK on Arc Testnet", body: "Real @unlink-xyz/sdk with createUnlinkClient + account.fromMnemonic — deposit(), transfer(), withdraw() against the Arc engine." },
      { icon: "🔒", title: "What's Private", body: "Counterparty link, transfer amount, and per-payment identity stay hidden. Each nanopayment uses a fresh burner retired after one use." },
    ],
    evidence: [
      { file: "src/integrations/unlink/index.ts", desc: "Live Unlink SDK — createUnlinkClient, deposit, privateTransfer, withdraw.", code: "createUnlinkClient({ engineUrl, account, evm })" },
      { file: "src/integrations/unlink/burner.ts", desc: "Ephemeral burner lifecycle — fund from pool, x402 pay, dispose.", code: "privateNanopayment({ url, amountUsd })" },
      { file: "app/api/privacy/nanopay/route.ts", desc: "Joint bounty endpoint — shield → burner → x402 settle on Arc.", code: "POST /api/privacy/nanopay" },
      { file: "app/api/privacy/shield/route.ts", desc: "Direct Unlink shield/transfer for private-mode payments.", code: "POST /api/privacy/shield" },
      { file: "src/core/payments/settlement.ts", desc: "Rail selection — isPrivate → unlink, else arc.", code: "selectRail() · settleOnRail(\"unlink\", …)" },
    ],
    why: [
      { icon: "✅", title: "Privacy is built-in", body: "Just add “privately” — no separate app. Balances, amounts, and counterparties stay hidden via the shielded pool." },
      { icon: "✅", title: "Unlinkable nanopayments", body: "Burner EOA pays x402 on Arc; user wallet never appears as payer of record on testnet.arcscan.app." },
      { icon: "✅", title: "Joint Dynamic + Arc", body: "Dynamic signs authorization, Unlink breaks the on-chain link, Arc settles gas-free — one contiguous flow on the homepage." },
      { icon: "✅", title: "Provable live demo", body: "npm run verify:nanopay returns settlementTx — open it on Arcscan; payer is the burner, gas is zero." },
    ],
    metrics: [
      { icon: "🕶️", label: "Hidden by Default", sub: "Amount + counterparty shielded" },
      { icon: "🔥", label: "Burner EOAs", sub: "Single-use, then disposed" },
      { icon: "🤝", label: "Dynamic + Arc", sub: "Joint private-nanopayments" },
    ],
    ctas: [
      { label: "▶ Autonomous Private Agent", href: "/", primary: true },
      { label: "🕶️ Send privately", href: "/messages" },
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
