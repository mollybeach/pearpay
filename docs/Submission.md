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

**Last updated:** 2026-06-13 15:05 EDT

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

Pear Pay also extends to the agentic economy: AI agents get their own Dynamic server wallet and can pay each other for APIs, compute, and data autonomously using HTTP 402 / x402 — the same infrastructure that powers human payments powering machine-to-machine commerce.

You can try it live at https://pearpay.app/: a clickable, screen-recordable Simulator reproduces the in-chat payment experience across six platforms (iMessage, Telegram, Discord, WhatsApp, Slack, X), and a "Try it" page does a real on-chain USDC transfer from your own wallet on Base Sepolia testnet — a genuine, verifiable transaction, not a mock.
```

### How it's made *(min 280 characters)*

```
Pear Pay is one unified TypeScript app: a Next.js (App Router) frontend + API that orchestrates every integration, with a thin native Swift iMessage extension where Apple requires it.

The brain is a dependency-free core in TypeScript so it behaves identically across every channel: an NLP parser turns "Send Molly $20 privately" into a structured PaymentIntent; a universal recipient resolver maps wallet address / phone / email / handle / existing-user to a delivery mode; a programmable escrow handles claimable payments; and a settlement orchestrator selects the rail per payment and serializes a JSON-safe result for the UI. Blockchain access is via viem/wagmi.

Two demo surfaces show this end to end: (1) a screen-recordable Simulator that reproduces the real in-chat UX across six platforms (iMessage, Telegram, Discord, WhatsApp, Slack, X) — pixel-faithful phone frame, on-screen iOS keyboard, and each platform's native confirmation pattern (Apple Pay sheet, Telegram inline buttons, Discord embeds, WhatsApp quick-replies, Slack Block Kit, X cards) — all sharing one tested component foundation; and (2) a live "Try it" page that does a REAL on-chain USDC transfer on Base Sepolia: connect a browser wallet via wagmi (injected connector), and transfer() Circle's testnet USDC to any address with a verifiable BaseScan link — no sponsor accounts or funded server keys required.

Partner tech and how it helps:
- Dynamic — embedded wallets for instant onboarding-on-claim and server/agent wallets for autonomous payments; powers login + signing.
- Arc (Circle) — Circle-native USDC settlement and chain-abstracted liquidity for the Arc rail.
- Unlink — private transfers via the real @unlink-xyz/sdk client (createUnlink + unlinkAccount.fromMnemonic, primitives deposit/transfer/withdraw) so balances, amounts, and counterparties stay hidden in "private mode."
- Twilio — SMS/WhatsApp claim-link delivery + Verify; this is what reaches recipients who don't have a wallet yet and solves the cold-start problem.

On-chain, PearPayEscrow.sol is a programmable USDC/EURC escrow (conditional release behind a keccak256 claim-secret, time-based auto-refund, sender cancellation) designed to deploy to Arc.

Hacky / notable bits:
- A "rail selector" replaces cross-chain bridging — Pear Pay treats Arc/Unlink as one settlement surface and picks the best one, while still abstracting chains away from the user.
- Claim links unfurl as rich payment cards in iMessage via a dynamic Next.js opengraph-image (1200×630) generated per pay-link.
- "Pay with Face ID" uses WebAuthn passkeys (@simplewebauthn) for biometric approval in the browser.
- Agent-to-agent payments use HTTP 402 / x402 with a Dynamic server wallet — no human in the loop.
- The "Try it" page is genuinely on-chain: wagmi + an injected browser wallet send a real Circle USDC transfer() on Base Sepolia (chain 84532) with a BaseScan receipt — judges can verify an actual transaction with zero sponsor credentials.
- The Simulator is one reusable foundation: a shared PhoneFrame, a theme-aware on-screen IosKeyboard, and a shared PearPayCard, with each of the six channel components layering on its platform-native chrome and confirmation flow.

The sponsor settlement rails (Arc/Unlink) run in sandbox/testnet mode for the demo so the full flow is reproducible without funded mainnet keys, while the "Try it" page is live on Base Sepolia.
```

### GitHub Repositories

**Select:** `mollybeach/pearpay` · label **Primary** · **Monorepo**

```
https://github.com/mollybeach/pearpay
```

---

## 2. Images

**Last updated:** 2026-06-13 15:05 EDT

Upload these in the **Images** step of the form.

| Field | Requirement | Pear Pay asset |
|-------|-------------|----------------|
| **Logo** | Square ~512×512 | Pear Pay pear mascot + wordmark (upload from your design folder) |
| **Cover image** | 16:9 (~640×360+) | Banner: "Turn Conversations into Web3 Transactions" + QR to https://pearpay.app/ |
| **Screenshots** | Min 3 | Use: Simulator (iMessage), Try it (real USDC), Prizes/Arc page |

**Suggested screenshot sources in repo:**

- `design/figma/02-simulator.svg` — export PNG for Simulator
- `design/figma/03-try-it.svg` — export PNG for Try it flow
- `design/figma/01-home.svg` — export PNG for landing page
- Live captures from https://pearpay.app/messages and https://pearpay.app/pay

**Checklist before Save & Continue:**

- [ ] Logo uploaded (square)
- [ ] Cover uploaded (16:9)
- [ ] At least 3 screenshots uploaded

---

## 3. Tech stack

**Last updated:** 2026-06-13 15:10 EDT

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

*(Production path for durable escrow + claimable-payment storage; hackathon MVP also uses in-memory `EscrowStore` for local demos.)*

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
Unlink SDK
Twilio
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
Cursor — used throughout the hackathon for scaffolding, refactors, and documentation (README, Submission.md, contract comments). All payment-critical paths (escrow, Flow, signing, webhooks) were reviewed manually by the team before demo.

OpenAI — optional Twilio Voice demo path interprets spoken payment intent ("Send Alex twenty dollars"); NLP parser is primarily rule-based TypeScript in src/core/nlp/ with AI assist for edge-case phrasing during development.

No AI-generated code was submitted without human review. See AI_ATTRIBUTION.md in the repo for team scope and review notes.
```

---

## 4. Select prizes

**Last updated:** 2026-06-13 15:05 EDT

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
Pear Pay uses Arc as its default USDC settlement and liquidity hub. Users never pick a chain — they send a message like "Pay Alex $20" and Pear Pay routes funds to Arc via PearPayEscrow.sol (conditional claim-secret release, expiry refund, sender cancel) and chain-abstracted settlement through our Arc integration. Claimable payments escrow USDC on Arc until the recipient onboards via Dynamic and claims.
```

#### Link to the line of code where the tech is used

```
https://github.com/mollybeach/pearpay/blob/main/contracts/PearPayEscrow.sol#L68-L74
https://github.com/mollybeach/pearpay/blob/main/src/integrations/arc/index.ts#L67-L75
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L78-L90
```

#### How easy is it to use? *(1–10)*

**Select:** `8`

#### Additional feedback for the Sponsor

```
Arc's USDC-native model maps cleanly to conversational payments — one settlement surface, no chain picker in UX. Foundry deploy + Arc testnet USDC address were straightforward. Circle Gateway/Forwarder for live source-to-Arc routing would benefit from a single end-to-end TypeScript example (detect source chain → quote → settle on Arc) in the docs; we scaffolded this in src/integrations/arc/ but had to infer request shapes from scattered Circle docs. A canonical "claimable escrow on Arc" reference repo would help hackathon teams ship faster.
```

**Bounty tracks to name in demo:** Best Smart Contracts on Arc with Advanced Stablecoin Logic · Best Chain Abstracted USDC Apps Using Arc as a Liquidity Hub

---

### Dynamic — $10,000

#### How are you using this Protocol / API? *(1–2 sentences)*

```
Pear Pay uses Dynamic for embedded wallet onboarding when recipients claim funds (no seed phrases), Fireblocks Flow for cross-chain checkout that settles USDC on Arc, and server wallets for autonomous agent payments (HTTP 402 / x402). Human path: NLP → WebAuthn Face ID → Flow checkout → Arc. Agent path: natural-language intent → Dynamic server wallet → pay gated API → retry on 402.
```

#### Link to the line of code where the tech is used

```
https://github.com/mollybeach/pearpay/blob/main/src/components/Providers.tsx#L13-L21
https://github.com/mollybeach/pearpay/blob/main/app/api/flow/payment/start/route.ts#L46-L50
https://github.com/mollybeach/pearpay/blob/main/src/integrations/dynamic/index.ts#L86-L112
https://github.com/mollybeach/pearpay/blob/main/src/integrations/dynamic/index.ts#L118-L133
https://github.com/mollybeach/pearpay/blob/main/app/api/agent/run-intent/route.ts#L36-L42
```

#### How easy is it to use? *(1–10)*

**Select:** `9`

#### Additional feedback for the Sponsor

```
Dynamic SDK integration for embedded wallets and auth was smooth — Providers + wallet button worked in under an hour. Flow's multi-step checkout (create → source → quote → prepare → broadcast → webhook) is powerful but dense; a single "happy path" sequence diagram with expected JSON payloads per step would reduce integration time. Server wallet REST API for agentic x402 flows is a strong differentiator — clearer docs on signing/submitting txs from server wallets (not just creating them) would unlock more agent builds.
```

**Bounty tracks to name in demo:** Best Use of Flow · Best Agentic Build · Best Overall Use · Best Private Nanopayments App *(joint with Unlink + Arc)*

---

### Unlink — $5,000

#### How are you using this Protocol / API? *(1–2 sentences)*

```
Pear Pay adds an optional private payment mode: users say "Send Sarah 50 USDC privately" and the orchestrator routes through Unlink's deposit/transfer/withdraw primitives so balances, amounts, and counterparties stay hidden while Arc still settles the public leg when needed. Private rail selection is automatic when isPrivate is set — no separate UX for shielding.
```

#### Link to the line of code where the tech is used

```
https://github.com/mollybeach/pearpay/blob/main/src/integrations/unlink/index.ts#L57-L74
https://github.com/mollybeach/pearpay/blob/main/src/integrations/unlink/index.ts#L98-L126
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L27-L28
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L68-L76
```

#### How easy is it to use? *(1–10)*

**Select:** `9`

#### Additional feedback for the Sponsor

```
Unlink's privacy primitives (deposit → private transfer → withdraw) fit naturally as a "private mode" toggle on top of conversational payments. Local stub mode made hackathon development fast. For production, clearer docs on how private balances interact with USDC on Arc (settlement timing, fee model, and error codes on failed shield/transfer) would help. A minimal Next.js example showing one private peer-to-peer transfer end-to-end would complement the SDK reference.
```

**Bounty tracks to name in demo:** Best Private Nano Payment App *(joint)* · Best Unlink Integration into a Major Open-Source App

---

## 5. Video

**Last updated:** 2026-06-13 15:05 EDT

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

**Suggested demo script:** see `docs/DYNAMIC_BOUNTY.md` and `docs/ARC_BOUNTY.md`.

**Cover in the video:**

1. Simulator — "Send Molly $20" across a messaging app
2. Try it — real Base Sepolia USDC transfer + BaseScan link
3. Arc escrow lifecycle + Flow checkout (if credentialed)
4. Private mode mention (Unlink) + agent x402 path (Dynamic server wallet)

---

## 6. Future

**Last updated:** 2026-06-13 15:05 EDT

*(Use this if the form asks about future plans / what happens after the hackathon.)*

```
After ETHGlobal NYC, Pear Pay will ship production escrow persistence (Postgres/KV), live Circle Gateway settlement on Arc, and Twilio claim delivery at scale. The iMessage extension moves from preview to TestFlight. Agent payments expand beyond the x402 demo to a marketplace where named agents discover and pay each other for APIs, compute, and data — all through the same conversational interface humans use. Private mode via Unlink becomes a one-tap default for sensitive transfers.
```

---

## 7. Final

**Last updated:** 2026-06-13 15:05 EDT

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
- Dynamic requires: **deployed app judges can use** — https://pearpay.app/ — + SDK integration visible in demo.
- Unlink requires: **working private flow demo** + README explaining what is private.
- Keep `docs/DYNAMIC_BOUNTY.md` open during the Dynamic booth / video.

### Reference docs in repo

| Doc | Purpose |
|-----|---------|
| `docs/ARC_BOUNTY.md` | Arc demo script + architecture |
| `docs/DYNAMIC_BOUNTY.md` | Flow + agentic demo script |
| `docs/AI_ATTRIBUTION.md` | AI tool disclosure |
| `README.md` | Architecture diagram + quick start |

---

*Document generated for ETHGlobal New York 2026 · Pear Pay 🍐*
