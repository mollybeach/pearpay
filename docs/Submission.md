# Pear Pay — ETHGlobal Submission

Answers for every field on the ETHGlobal project submission form, in **the same order as the website sidebar**.

> **Tip:** Use the copy icon on each code block (GitHub / Cursor preview), or select the text inside the fence.

---

## Table of contents

1. [Project details](#1-project-details)
2. [Images](#2-images)
3. [Tech stack](#3-tech-stack)
4. [Select prizes](#4-select-prizes)
5. [Video](#5-video)
6. [Future](#6-future)
7. [Final](#7-final)

---

## 1. Project details

**Last updated:** 2026-06-14 06:45 EDT

### Project name

```
Pear Pay
```

### What category does your project belong to?

```
Wallet/Payments
```

### What emoji best represents your project?

```
🍐
```

### If you have a demonstration, link to it here!

```
https://pearpay.app/
```

### Short description *(max 100 characters)*

```
The Apple Pay for Web3: send crypto in any messaging app using natural language.
```

*(96 characters. Alternates:)*

```
Send money in any chat. Pear Pay turns plain English into private, chain-abstracted USDC payments.
```

### Description *(min 280 characters)*

```
Pear Pay is a conversational payment protocol that lets you send money anywhere you communicate — iMessage, Telegram, WhatsApp, Discord, Slack, X, or even between AI agents. Instead of wallets, seed phrases, chains, bridges, swaps, and gas, you just express intent: "Send Molly $20," "Pay Alex back for dinner," or "Send Sarah 50 USDC privately."

Behind that single message, Pear Pay resolves the recipient (wallet address, phone, email, handle, or existing Pear Pay user), picks the optimal settlement rail, settles in USDC, and optionally shields the transfer so amounts and counterparties stay private.

Crucially, payments never fail because the recipient hasn't onboarded. If they have no wallet, Pear Pay escrows the USDC and delivers a claim link over SMS/WhatsApp via Twilio; the recipient taps it, an embedded wallet is created instantly through Dynamic, and the funds release — solving the cold-start problem that kills most crypto payment apps.

Pear Pay also extends to the agentic economy: AI agents get their own Dynamic server wallet (or Delegated Access MPC wallet after one Face ID grant) and can pay each other for APIs, compute, and data autonomously using HTTP 402 / x402 — the same infrastructure that powers human payments powering machine-to-machine commerce.

You can try it live at https://pearpay.app/: a clickable, screen-recordable Simulator reproduces the in-chat payment experience across six platforms (iMessage, Telegram, Discord, WhatsApp, Slack, X), and a "Try it" page does a real on-chain USDC transfer from your own wallet on Arc Testnet — a genuine, verifiable transaction on testnet.arcscan.app, not a mock. The homepage also runs a one-click Autonomous Private Agent timeline (Dynamic sign → Unlink shield → Circle Gateway x402 settle on Arc) that judges can screen-record end to end. A live Telegram bot webhook at /api/telegram parses payment intents and replies in-chat when configured.
```

### How it's made *(min 280 characters)*

```
Pear Pay is one unified TypeScript app: a Next.js (App Router) frontend + API that orchestrates every integration, with a thin native Swift iMessage extension where Apple requires it.

The brain is a dependency-free core in TypeScript so it behaves identically across every channel: an NLP parser turns "Send Molly $20 privately" into a structured PaymentIntent; a universal recipient resolver maps wallet address / phone / email / handle / existing-user to a delivery mode; a programmable escrow handles claimable payments; and a settlement orchestrator selects the rail per payment and serializes a JSON-safe result for the UI. Blockchain access is via viem/wagmi.

Two demo surfaces show this end to end: (1) a screen-recordable Simulator that reproduces the real in-chat UX across six platforms (iMessage, Telegram, Discord, WhatsApp, Slack, X) — pixel-faithful phone frame, on-screen iOS keyboard, and each platform's native confirmation pattern (Apple Pay sheet, Telegram inline buttons, Discord embeds, WhatsApp quick-replies, Slack Block Kit, X cards) — all sharing one tested component foundation; and (2) a live "Try it" page at /pay that does a REAL on-chain USDC transfer on Arc Testnet (chain 5042002): connect a browser wallet via wagmi (injected connector), switch to Arc if needed, and transfer() Circle's testnet USDC to any address with a verifiable Arcscan link — no sponsor accounts or funded server keys required.

Partner tech and how it helps:
- Dynamic — embedded wallets for instant onboarding-on-claim, Fireblocks Flow for cross-chain checkout that settles USDC on Arc, server/agent wallets for autonomous payments, and Delegated Access (Face ID once → backend signs autonomously via sealed MPC key shares).
- Arc (Circle) — Circle-native USDC settlement on Arc Testnet, PearPayEscrow.sol deployed on-chain (claim-secret release, expiry refund, sender cancel, dispute/arbiter), real @circle-fin/x402-batching gas-free nanopayments via BatchFacilitatorClient, and Circle Gateway bridge for chain-abstracted liquidity.
- Unlink — private transfers via the real @unlink-xyz/sdk client (createUnlink + unlinkAccount.fromMnemonic, primitives deposit/transfer/withdraw) plus ephemeral burner EOAs for unlinkable private nanopayments (shielded pool → burner → x402 → dispose).
- Twilio — SMS/WhatsApp claim-link delivery + Verify; this is what reaches recipients who don't have a wallet yet and solves the cold-start problem.
- Telegram — live bot webhook (/api/telegram) that parses natural-language payment intents and replies in-chat, sharing the same orchestrator as Twilio.

On-chain, PearPayEscrow.sol is deployed on Arc Testnet at 0x065484A8DAc3A9c3288b9C575a54947B0A1bC7eB — a programmable USDC/EURC escrow (conditional release behind a keccak256 claim-secret, time-based auto-refund, sender cancellation, optional arbiter dispute resolution).

Hacky / notable bits:
- A "rail selector" replaces cross-chain bridging — Pear Pay treats Arc/Unlink as one settlement surface and picks the best one, while still abstracting chains away from the user.
- Claim links unfurl as rich payment cards in iMessage via a dynamic Next.js opengraph-image (1200×630) generated per pay-link.
- "Pay with Face ID" uses WebAuthn passkeys (@simplewebauthn) for biometric approval in the browser and bootstraps Dynamic Delegated Access.
- Agent-to-agent payments use HTTP 402 / x402 with Dynamic server wallets or delegated MPC signing — no human in the loop after one Face ID grant.
- The joint private nanopayment flow (Unlink shield → ephemeral burner → Circle Gateway x402 on Arc) runs live via POST /api/privacy/nanopay and is visualized on the homepage in PrivateAgentRun.tsx.
- The "Try it" page is genuinely on-chain: wagmi + an injected browser wallet send a real Circle USDC transfer() on Arc Testnet (chain 5042002) with an Arcscan receipt — judges can verify an actual transaction with zero sponsor credentials.
- The Simulator is one reusable foundation: a shared PhoneFrame, a theme-aware on-screen IosKeyboard, and a shared PearPayCard, with each of the six channel components layering on its platform-native chrome and confirmation flow.
- Escrow persistence degrades gracefully: without ESCROW_DATABASE_URL the app uses an in-memory EscrowStore so production never crashes on missing Postgres.

The sponsor settlement rails (Arc/Unlink/x402) run on Arc Testnet for the demo so the full flow is reproducible without funded mainnet keys. Circle Gateway bridge can mint USDC onto Arc from a cross-chain pool (default source: Base Sepolia) when CIRCLE_API_KEY is set.
```

### GitHub Repositories

**Select:** `mollybeach/pearpay` · label **Primary** · **Monorepo**

```
https://github.com/mollybeach/pearpay
```

---

## 2. Images

**Last updated:** 2026-06-14 06:45 EDT

Upload these in the **Images** step of the form.

| Field | Requirement | Pear Pay asset |
|-------|-------------|----------------|
| **Logo** | Square ~512×512 | Pear Pay pear mascot + wordmark (upload from your design folder) |
| **Cover image** | 16:9 (~640×360+) | Banner: "Turn Conversations into Web3 Transactions" + QR to https://pearpay.app/ |
| **Screenshots** | Min 3 | Use: Simulator (iMessage), Try it (Arc Testnet USDC), Private Agent timeline / Prizes page |

**Suggested screenshot sources in repo:**

- `design/figma/02-simulator.svg` — export PNG for Simulator
- `design/figma/03-try-it.svg` — export PNG for Try it flow
- `design/figma/01-home.svg` — export PNG for landing page
- Live captures from https://pearpay.app/messages, https://pearpay.app/pay, and https://pearpay.app/prizes (Autonomous Private Agent timeline)

**Checklist before Save & Continue:**

- [ ] Logo uploaded (square)
- [ ] Cover uploaded (16:9)
- [ ] At least 3 screenshots uploaded

---

## 3. Tech stack

**Last updated:** 2026-06-14 06:45 EDT

Copy each multiselect block into the matching ETHGlobal dropdown.

### Are you using any Ethereum developer tools?

**All form options:**

`1"` · `Alchemy` · `Alchemyweb3` · `Anon Aadhaar` · `ASI` · `Avail` · `Bandada` · `Brownie` · `cmtp` · `Create Eth App` · `Curvegrid` · `Dappsys` · `Embark` · `Epirus` · `Etherlime` · `ethers-rs` · `ethers.js` · `Fluence` · `Foundry` · `Hardhat` · `HQ20` · `Hyperlane` · `LayerZero` · `Ledger` · `light.js` · `Lighthouse` · `MACI` · `MUD` · `None` · `Ocean` · `OpenZeppelin SDK` · `Privy` · `Proof of Email` · `Remix` · `Reown` · `Saga` · `scaffold-eth` · `Self` · `Semaphore` · `Sindri` · `The Graph` · `Truffle` · `TypeChain` · `vlayer` · `Waffle` · `Walrus` · `web3-wrapper` · `web3.js` · `Web3j`

**Select ONLY for Pear Pay:**

```
Foundry
Reown
```

**Do not select:** `None`, `Hardhat`, `Truffle`, `Brownie`, `Remix`, `ethers.js`, `web3.js`, `Alchemy`, `OpenZeppelin SDK`, `Privy`, `scaffold-eth`, `The Graph`, `LayerZero`, or anything else unless Pear Pay uses it directly.

---

### Which blockchain networks will your project interact with?

**All form options:**

`0G` · `Aleo` · `Aptos` · `Arc` · `Arcology` · `Arbitrum` · `Base` · `Binance Smart Chain` · `Bitcoin` · `Cardano` · `Celo` · `Chiliz` · `Citrea` · `Cosmos` · `Ethereum` · `Etherlink` · `EVVM` · `Filecoin` · `Flare` · `Flow` · `Gnosis` · `Hedera` · `Integra` · `Internet Computer (ICP)` · `Intmax` · `Iron Fish` · `Kadena` · `Loopring` · `Mantle` · `Mina` · `Monad` · `None` · `Oasis` · `Optimism` · `Polkadot` · `Polygon` · `Polygon POS` · `Polygon zkEVM` · `Ripple` · `Ronin` · `Rootstock` · `Scroll` · `Starknet` · `Stellar` · `Sui` · `Tezos` · `Ton` · `Tron` · `Worldchain` · `xDai` · `XRP Ledger` · `Yellow` · `Zircuit` · `zkSync`

**Select for Pear Pay:**

```
Arc
Ethereum
Arbitrum
Base
Optimism
Polygon
```

**Do not select:** `Flow` (Dapper blockchain — not Fireblocks Flow), `None`, or chains with no code integration.

---

### Which programming languages are you using?

**All form options:**

`APL` · `Assembly` · `Bash/Shell` · `C` · `C#` · `C++` · `Cadence` · `Cairo` · `Clojure` · `COBOL` · `Crystal` · `Dart` · `Delphi` · `Elixir` · `Erlang` · `F#` · `Fe` · `Go` · `Groovy` · `Haskell` · `HTML/CSS` · `Java` · `JavaScript` · `Julia` · `Kotlin` · `LISP` · `Matlab` · `Node.js` · `None` · `Objective-C` · `Perl` · `PHP` · `PowerShell` · `Python` · `R` · `Ruby` · `Rust` · `Scala` · `Solidity` · `SQL` · `Swift` · `TypeScript` · `VBA` · `Vyper`

**Select for Pear Pay:**

```
TypeScript
JavaScript
Solidity
Swift
Node.js
```

**Do not select:** `None`, or languages with no project code (Python, Rust, Go, etc.).

---

### Are you using any web frameworks?

**All form options:**

`Angular` · `Angular.js` · `ASP.NET` · `ASP.NET Core` · `Django` · `Drupal` · `Express` · `FastAPI` · `Flask` · `Gatsby` · `jQuery` · `Laravel` · `Next.js` · `None` · `React.js` · `Ruby on Rails` · `Spring` · `Svelte` · `Symfony` · `Vue.js`

**Select for Pear Pay:**

```
Next.js
React.js
```

**Do not select:** `None`, or frameworks Pear Pay does not use (Vue.js, Angular, Svelte, Express, Django, etc.).

---

### Are you using any databases?

**All form options:**

`AvionDB` · `Cassandra` · `Couchbase` · `DynamoDB` · `Elasticsearch` · `Firebase` · `IBM DB2` · `IPDB` · `LevelDB` · `MariaDB` · `Microsoft SQL Server` · `MongoDB` · `MySQL` · `None` · `Oracle` · `OrbitDB` · `PostgreSQL` · `Redis` · `SQLite` · `Supabase`

**Select for Pear Pay:**

```
Supabase
```

*(Production path for durable escrow + claimable-payment storage via Supabase/Postgres; without ESCROW_DATABASE_URL the app falls back to in-memory `EscrowStore` so Vercel never crashes.)*

---

### Are you using any design tools?

**All form options:**

`Figma` · `Flutter` · `Illustrator` · `MS Paint` · `None` · `Photoshop` · `Sketch` · `Webflow` · `Zeppelin`

**Select for Pear Pay:**

```
Figma
```

*(UI mockups and screen flows in `design/figma/` — exported SVG frames imported back into Figma for the Simulator, Try it, home, and claim screens.)*

---

### Other specific technologies *(free-text multiselect — one per line)*

*No fixed dropdown — type each value and press Enter. Suggested list for Pear Pay:*

```
viem
wagmi
Dynamic SDK
Fireblocks Flow
Circle Arc
Circle x402-batching
Unlink SDK
Twilio
Telegram Bot API
WebAuthn
HTTP 402
Tailwind CSS
npm
Vercel
Xcode
zod
vitest
Cursor
```

**Optional** (add only if you demo them):

```
OpenAI
Twilio Voice
```

**Already covered in other form fields — do not duplicate:** Next.js, React.js, Foundry/Reown (Ethereum dev tools), Arc/Ethereum/Arbitrum/Base/Optimism/Polygon (networks), TypeScript/JavaScript/Solidity/Swift/Node.js (languages), Supabase (databases), Figma (design tools).

---

### Describe how AI tools were used *(if applicable)*

```
Cursor — inline completion, refactors, Next.js/Tailwind scaffolding, and docs throughout the hackathon. Claude Code — documentation consolidation and submission-prep review. LingCode — terminal-native backend automation and running the test suite. OpenAI — optional Twilio Voice demo path only (interprets spoken intent "Send Alex twenty dollars"); the core NLP parser is rule-based TypeScript in src/core/nlp/.

All payment-critical paths (escrow, Flow, signing, webhooks, SDK integrations) were written and/or reviewed manually by the team before demo. No AI-generated code was submitted without human review, and no AI voiceover is used in the demo video. See AI_ATTRIBUTION.md at the repo root for the full file-level disclosure.
```

---

## 4. Select prizes

**Last updated:** 2026-06-14 06:45 EDT

### Continuity Mode

**Select:** Building from Scratch

```
Building from Scratch
```

### Submission type

**Select:** Top 10 Finalist & Partner Prizes

```
Top 10 Finalist & Partner Prizes
```

**Live judging:** Sunday, June 14, 2026 at **2:30 PM EDT**.

### Which partner prizes are you applying for?

**Check these three:** Arc ($15,000) · Dynamic ($10,000) · Unlink ($5,000)

### Arc — $15,000

#### How are you using this Protocol / API? *(1–2 sentences)*

```
Pear Pay uses Arc as its default USDC settlement and liquidity hub on Arc Testnet (5042002). Users never pick a chain — they send a message like "Pay Alex $20" and Pear Pay routes funds via PearPayEscrow.sol (deployed on Arc: conditional claim-secret release, expiry refund, sender cancel, dispute/arbiter) and chain-abstracted settlement through our Arc integration. Sub-cent gas-free nanopayments settle via the real @circle-fin/x402-batching SDK (BatchFacilitatorClient verify/settle on EIP-3009). Claimable payments escrow USDC on Arc until the recipient onboards via Dynamic and claims.
```

#### Link to the line of code where the tech is used

```
https://github.com/mollybeach/pearpay/blob/main/contracts/PearPayEscrow.sol#L88-L96
https://github.com/mollybeach/pearpay/blob/main/src/integrations/arc/index.ts#L109-L128
https://github.com/mollybeach/pearpay/blob/main/src/integrations/arc/x402-gateway.ts#L185-L220
https://github.com/mollybeach/pearpay/blob/main/app/api/x402/premium/data/route.ts#L22-L50
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L68-L85
```

#### How easy is it to use? *(1–10)*

**Select:** `8`

#### Additional feedback for the Sponsor

```
Arc's USDC-native model maps cleanly to conversational payments — one settlement surface, no chain picker in UX. Foundry deploy + Arc testnet USDC address were straightforward; PearPayEscrow is live on Arc Testnet. We shipped real @circle-fin/x402-batching (BatchFacilitatorClient + GatewayClient) for gas-free sub-cent settlement — the SDK worked once we mapped eip155:5042002 and the GatewayWallet verifying contract. A canonical "private nanopayment on Arc" reference (shield → burner → x402 → Arcscan proof) would help joint-bounty teams; we documented ours in README and npm run verify:nanopay.
```

**Bounty tracks to name in demo:** Best Smart Contracts on Arc with Advanced Stablecoin Logic · Best Chain Abstracted USDC Apps Using Arc as a Liquidity Hub

---

### Dynamic — $10,000

#### How are you using this Protocol / API? *(1–2 sentences)*

```
Pear Pay uses Dynamic for embedded wallet onboarding when recipients claim funds (no seed phrases), Fireblocks Flow for cross-chain checkout that settles USDC on Arc, server wallets for autonomous agent payments (HTTP 402 / x402), and Delegated Access so the backend signs autonomously after one Face ID/WebAuthn grant (RSA-decrypted key shares via /api/webhooks/dynamic). Human path: NLP → WebAuthn Face ID → Flow checkout → Arc. Agent path: natural-language intent → Dynamic server wallet or delegated MPC wallet → pay gated API → retry on 402. The homepage PrivateAgentRun component runs this as a live step-by-step timeline.
```

#### Link to the line of code where the tech is used

```
https://github.com/mollybeach/pearpay/blob/main/src/components/Providers.tsx#L12-L26
https://github.com/mollybeach/pearpay/blob/main/src/components/PrivateAgentRun.tsx#L1-L15
https://github.com/mollybeach/pearpay/blob/main/src/integrations/dynamic/delegated-wallet.ts#L18-L33
https://github.com/mollybeach/pearpay/blob/main/app/api/webhooks/dynamic/route.ts#L1-L11
https://github.com/mollybeach/pearpay/blob/main/app/api/flow/payment/start/route.ts#L46-L53
https://github.com/mollybeach/pearpay/blob/main/src/integrations/dynamic/index.ts#L88-L113
https://github.com/mollybeach/pearpay/blob/main/app/api/agent/run-intent/route.ts#L36-L42
https://github.com/mollybeach/pearpay/blob/main/app/api/agent/delegated-pay/route.ts
```

#### How easy is it to use? *(1–10)*

**Select:** `9`

#### Additional feedback for the Sponsor

```
Dynamic SDK integration for embedded wallets and auth was smooth — Providers + wallet button worked in under an hour. Delegated Access is a strong differentiator for agentic flows: one Face ID grant, then the server signs x402 autonomously. Flow's multi-step checkout (create → source → quote → prepare → broadcast → webhook) is powerful but dense; a single "happy path" sequence diagram with expected JSON payloads per step would reduce integration time. Server wallet REST API + delegation webhook docs on signing/submitting txs from server wallets (not just creating them) would unlock more agent builds.
```

**Bounty tracks to name in demo:** Best Use of Flow · Best Agentic Build · Best Overall Use · Best Private Nanopayments App *(joint with Unlink + Arc)*

---

### Unlink — $5,000

#### How are you using this Protocol / API? *(1–2 sentences)*

```
Pear Pay adds an optional private payment mode: users say "Send Sarah 50 USDC privately" and the orchestrator routes through Unlink's deposit/transfer/withdraw primitives so balances, amounts, and counterparties stay hidden while Arc still settles the public leg when needed. For the joint private-nanopayment bounty, Unlink shields USDC into a single-use ephemeral burner EOA that pays via Circle Gateway x402 on Arc — the chain only ever sees pool → burner → seller, never user → seller. Private rail selection is automatic when isPrivate is set — no separate UX for shielding.
```

#### Link to the line of code where the tech is used

```
https://github.com/mollybeach/pearpay/blob/main/src/integrations/unlink/index.ts#L74-L99
https://github.com/mollybeach/pearpay/blob/main/src/integrations/unlink/burner.ts#L157-L178
https://github.com/mollybeach/pearpay/blob/main/app/api/privacy/nanopay/route.ts#L16-L20
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L22-L25
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L58-L65
```

#### How easy is it to use? *(1–10)*

**Select:** `9`

#### Additional feedback for the Sponsor

```
Unlink's privacy primitives (deposit → private transfer → withdraw) fit naturally as a "private mode" toggle on top of conversational payments. The real @unlink-xyz/sdk on Arc Testnet powers live private transfers and the burner nanopay path; stub mode remains for local dev without credentials. For production, clearer docs on how private balances interact with USDC on Arc (settlement timing, fee model, and error codes on failed shield/transfer) would help. Our npm run verify:nanopay script returns a settlementTx on testnet.arcscan.app where the payer is the burner, not the user — a concrete proof judges can open.
```

**Bounty tracks to name in demo:** Best Private Nano Payment App *(joint)* · Best Unlink Integration into a Major Open-Source App

---

## 5. Video

**Last updated:** 2026-06-14 06:45 EDT

### Demo video requirements

- Format: `.mp4` or `.mov`
- Length: **2–4 minutes**
- Resolution: minimum **720p**
- Audio: required; **no background music**
- No speed-ups (per project rules)

### Demo video link *(paste when uploaded)*

```
TODO: add the recorded demo link before final submission
```

**Suggested demo script:** see [`docs/JUDGING.md`](./JUDGING.md) · [`docs/ARC_BOUNTY.md`](./ARC_BOUNTY.md) · [`docs/DYNAMIC_BOUNTY.md`](./DYNAMIC_BOUNTY.md) · [`docs/UNLINK_BOUNTY.md`](./UNLINK_BOUNTY.md) · run `npm run judge:demo` before recording.

**Cover in the video:**

1. Simulator — "Send Molly $20" across a messaging app
2. Try it — real Arc Testnet USDC transfer + Arcscan link (https://pearpay.app/pay)
3. Autonomous Private Agent — one-click timeline on homepage (Dynamic → Unlink → Circle Gateway x402 on Arc)
4. Arc escrow lifecycle + Flow checkout (if credentialed)
5. Private nanopayment proof — open settlementTx on testnet.arcscan.app (payer is burner, not user)
6. Optional: live Telegram bot in-chat payment intent

---

## 6. Future

**Last updated:** 2026-06-14 06:45 EDT

*(Use this if the form asks about future plans / what happens after the hackathon.)*

```
After ETHGlobal NYC, Pear Pay will ship production escrow persistence (Postgres/Supabase — in-memory fallback already prevents prod crashes when ESCROW_DATABASE_URL is unset), Twilio claim delivery at scale, and the iMessage extension from preview to TestFlight. Agent payments expand beyond the x402 demo to a marketplace where named agents discover and pay each other for APIs, compute, and data — all through the same conversational interface humans use. Private mode via Unlink becomes a one-tap default for sensitive transfers. Live Circle Gateway x402 settlement, Delegated Access, and the private nanopay flow are already on Arc Testnet at https://pearpay.app/.
```

---

## 7. Final

**Last updated:** 2026-06-14 06:45 EDT

### Submission checklist *(before you hit Submit)*

- [ ] **Public repo with commits** — github.com/mollybeach/pearpay
- [ ] **Demonstration link** — https://pearpay.app/
- [ ] **Project video** — 2–4 min uploaded
- [ ] **Logo, cover, 3+ screenshots** uploaded
- [ ] **Tech stack** multiselects filled (section 3)
- [ ] **Partner prizes** — Arc, Dynamic, Unlink selected + form fields filled (section 4)
- [ ] **GitHub repo** selected in form picker (Primary · Monorepo)
- [ ] **Continuity:** Building from Scratch
- [ ] **Submission type:** Top 10 Finalist & Partner Prizes

### Partner judging reminders

- Name the bounty explicitly in your demo (e.g. "Arc — Best Smart Contracts with Advanced Stablecoin Logic").
- Arc + joint Unlink prize require: **MVP + architecture diagram + video + public repo**.
- Dynamic requires: **deployed app judges can use** — https://pearpay.app/ — + SDK integration visible in demo (PrivateAgentRun on homepage).
- Unlink requires: **working private flow demo** + README explaining what is private — run `npm run verify:nanopay` and open `settlementTx` on testnet.arcscan.app.
- Keep `docs/DYNAMIC_BOUNTY.md` open during the Dynamic booth / video.
- Run `npm run judge:demo` before recording — runs verify:arc, verify:dynamic, verify:flow, verify:unlink, verify:bridge, verify:nanopay.

### Reference docs in repo

| Doc | Purpose |
|-----|---------|
| `docs/JUDGING.md` | Master live-judging checklist (all 3 prize pools) |
| `docs/ARC_BOUNTY.md` | Arc demo script + architecture |
| `docs/DYNAMIC_BOUNTY.md` | Flow + agentic demo script |
| `docs/UNLINK_BOUNTY.md` | Unlink private-mode demo + env setup |
| `docs/AI_ATTRIBUTION.md` | AI tool disclosure |
| `README.md` | Architecture diagram + quick start + judges' Sponsor Integrations section |
| `docs/ENV_SETUP.md` | Env var setup for all integrations |

---

*Document generated for ETHGlobal New York 2026 · Pear Pay 🍐*
