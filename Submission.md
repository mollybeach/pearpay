# Pear Pay — ETHGlobal Submission

Answers for every field on the ETHGlobal project submission form. Copy each block into the matching field.

---

## Project name

```
Pear Pay
```

---

## What category does your project belong to?

```
Wallet/Payments
```

---

## What emoji best represents your project?

```
🍐
```

---

## If you have a demonstration, link to it here!

```
https://pearpay.vercel.app/
```

---

## Short description
*(max 100 characters — fits in a tweet)*

```
Send money in any chat. Pear Pay turns plain English into private, chain-abstracted USDC payments.
```

*(98 characters. Alternates if you want a different angle:)*

```
The Apple Pay of Web3 — say "Send Molly $20" in any chat and it settles in USDC. No wallets, no chains.
```
```
Turn conversations into transactions. Conversational USDC payments for humans and AI agents.
```

---

## Description
*(min 280 characters — be clear and detailed)*

```
Pear Pay is a conversational payment protocol that lets you send money anywhere you communicate — iMessage, Telegram, WhatsApp, Discord, Slack, or even between AI agents. Instead of wallets, seed phrases, chains, bridges, swaps, and gas, you just express intent: "Send Molly $20," "Pay Alex back for dinner," or "Send Sarah 50 USDC privately."

Behind that single message, Pear Pay resolves the recipient (ENS name, phone, email, handle, or existing Pear Pay user), picks the optimal settlement rail, settles in USDC, and optionally shields the transfer so amounts and counterparties stay private. Every payment writes a tamper-proof audit receipt to the Hedera Consensus Service.

Crucially, payments never fail because the recipient hasn't onboarded. If they have no wallet, Pear Pay escrows the USDC and delivers a claim link over SMS/WhatsApp via Twilio; the recipient taps it, an embedded wallet is created instantly through Dynamic, and the funds release — solving the cold-start problem that kills most crypto payment apps.

Pear Pay also extends to the agentic economy: AI agents get their own ENS identity and Dynamic server wallet and can pay each other for APIs, compute, and data autonomously using HTTP 402 / x402 — the same infrastructure that powers human payments powering machine-to-machine commerce.
```

---

## How it's made
*(min 280 characters — the nitty-gritty: technologies, how it's pieced together, partner tech, anything hacky)*

```
Pear Pay is one unified TypeScript app: a Next.js (App Router) frontend + API that orchestrates every integration, with a thin native Swift iMessage extension where Apple requires it.

The brain is a dependency-free core in TypeScript so it behaves identically across every channel: an NLP parser turns "Send Molly $20 privately" into a structured PaymentIntent; a universal recipient resolver maps ENS / phone / email / handle / existing-user to a delivery mode; a programmable escrow handles claimable payments; and a settlement orchestrator selects the rail per payment and serializes a JSON-safe result for the UI. Blockchain access is via viem/wagmi.

Partner tech and how it helps:
- Dynamic — embedded wallets for instant onboarding-on-claim and server/agent wallets for autonomous payments; powers login + signing.
- ENS — human-readable identity and recipient discovery for both people and AI agents (forward/reverse resolution + ENSIP-26 text records for agent endpoints).
- Hedera — primary settlement rail: USDC via the Hedera Token Service (HTS), and a tamper-proof, ordered audit receipt for every payment/escrow/claim via the Hedera Consensus Service (HCS). Sub-cent fees + 3–5s finality make conversational and nano payments viable.
- Arc (Circle) — Circle-native USDC settlement and chain-abstracted liquidity for the Arc rail.
- Unlink — private transfers (deposit/transfer/withdraw) so balances, amounts, and counterparties stay hidden in "private mode."
- Twilio — SMS/WhatsApp claim-link delivery + Verify; this is what reaches recipients who don't have a wallet yet and solves the cold-start problem.

On-chain, PearPayEscrow.sol is a programmable USDC/EURC escrow (conditional release behind a keccak256 claim-secret, time-based auto-refund, sender cancellation) designed to deploy to both Arc and Hedera's EVM (Smart Contract Service) from the same bytecode.

Hacky / notable bits:
- A "rail selector" replaces cross-chain bridging — Pear Pay treats Hedera/Arc/Unlink as one settlement surface and picks the best one, while still abstracting chains away from the user.
- Claim links unfurl as rich payment cards in iMessage via a dynamic Next.js opengraph-image (1200×630) generated per pay-link.
- "Pay with Face ID" uses WebAuthn passkeys (@simplewebauthn) for biometric approval in the browser.
- Agent-to-agent payments use HTTP 402 / x402 with a Dynamic server wallet — no human in the loop.
- Every settlement also emits an HCS receipt, giving an immutable audit trail for human and machine transactions.

The whole thing runs in sandbox/testnet mode for the demo so the full flow is reproducible without funded mainnet keys.
```

---

## GitHub Repositories

```
https://github.com/mollybeach/pearpay
```

---

## Project video
*(2–4 min demo — see DYNAMIC_BOUNTY.md)*

```
TODO: add the recorded demo link before final submission
```

---

## Submission requirements checklist
*(from the side panel of the form)*

- [ ] **Public repo with commits** — repo is public at github.com/mollybeach/pearpay; ensure commit history shows your work.
- [ ] **Demonstration link** — https://pearpay.vercel.app/ (deploy to production + set `NEXT_PUBLIC_SITE_URL`).
- [ ] **Project video** — record and link a 2–4 min demo.
- [ ] **Select GitHub account + repository** in the form's repo picker.
- [ ] **Click Save changes.**

---

## Partner prizes

Select **Arc**, **Dynamic**, and **Unlink** on the form. Apply to the bounties below and name the track in your submission text / demo video.

### Arc — $15,000

**Apply for:**

| Bounty | Amount | Pear Pay angle |
|--------|--------|----------------|
| Best Smart Contracts on Arc with Advanced Stablecoin Logic | $3,500 (1st $2,250 / 2nd $1,250) | `PearPayEscrow.sol` — conditional USDC/EURC escrow, claim-secret release, time-based auto-refund, sender cancel |
| Best Chain Abstracted USDC Apps Using Arc as a Liquidity Hub | $3,500 (1st $2,250 / 2nd $1,250) | Users never pick a chain; Flow settles to USDC on Arc from any source chain/token |

**Submission blurb (paste into Arc partner notes if asked):**

```
Pear Pay settles conversational payments in USDC on Arc. PearPayEscrow.sol implements conditional escrow (claim secret, expiry refund, cancel). Dynamic Flow routes payer funds from any chain/token into USDC on Arc. Claimable payments + chain abstraction solve the cold-start problem without fragmenting UX.
```

**Arc qualification checklist:**

- [ ] Working frontend + backend + architecture diagram (see README Updated Architecture)
- [ ] Video demo showing escrow + Arc settlement
- [ ] Public GitHub repo

---

### Dynamic — $10,000

**Apply for:**

| Bounty | Amount | Pear Pay angle |
|--------|--------|----------------|
| Best Use of Flow | $3,000 | Full Flow checkout: `/api/flow/payment/*` — create → source → quote → prepare → broadcast → webhook/poll |
| Best Agentic Build | $2,000 | Dynamic server wallet + `/api/agent/run-intent` — autonomous x402 pay → API access |
| Best Overall Use | $2,000 | Embedded wallets on claim, social auth, signing, onchain UX across the app |
| Best Private Nanopayments App *(joint with Unlink + Arc)* | 1st $2,000 / 2nd $1,000 | Dynamic wallet + Unlink privacy + Arc settlement for private micropayments |

**Submission blurb:**

```
Pear Pay uses Dynamic for embedded wallet onboarding on claim, Fireblocks Flow for cross-chain USDC settlement on Arc, and server wallets for autonomous agent payments (HTTP 402 / x402). Human path: NLP → Face ID → Flow → Arc. Agent path: intent → server wallet → pay → API.
```

**Dynamic qualification checklist:**

- [ ] Dynamic SDK integrated (`@dynamic-labs/sdk-react-core`, `@dynamic-labs/ethereum`)
- [ ] App deployed and usable by judges — https://pearpay.vercel.app/
- [ ] Flow implemented for Best Use of Flow (see DYNAMIC_BOUNTY.md demo script)
- [ ] Server wallet + agent autonomy for Best Agentic Build

---

### Unlink — $5,000

**Apply for:**

| Bounty | Amount | Pear Pay angle |
|--------|--------|----------------|
| Best Private Nano Payment App *(joint with Dynamic + Arc)* | 1st $2,000 / 2nd $1,000 | Private claimable payments — amounts and counterparties hidden via Unlink `deposit()` / `transfer()` |
| Best Unlink Integration into a Major Open-Source App | $2,500 | Privacy layer on conversational payments (`/api/privacy/shield`, Unlink SDK integration) |

**Submission blurb:**

```
Pear Pay adds a private payment mode via Unlink: users say "Send Sarah 50 USDC privately" and balances, amounts, and counterparties stay hidden while Arc settles. Uses Unlink SDK primitives (deposit/transfer/withdraw) on top of Dynamic wallet creation.
```

**Unlink qualification checklist:**

- [ ] Unlink SDK integrated (`@unlink-xyz/sdk`)
- [ ] At least one private primitive demonstrated in demo
- [ ] Public repo + README explaining what is now private
- [ ] For joint prize: also Dynamic SDK + Circle/Arc tools + MVP + diagram + video

---

## Tech stack *(form multiselect fields)*

Copy the selections below into each ETHGlobal dropdown. Use **Other** / free-text where the exact option is missing.

### Are you using any Ethereum developer tools for your project?

```
Solidity
viem
wagmi
ENS
Hardhat / Foundry (contract compile & deploy)
Circle Developer tools (USDC, Gateway, Wallets)
Dynamic SDK
Unlink SDK
Twilio (claim delivery — not Ethereum-native but part of stack)
Hedera SDK (@hashgraph/sdk — HCS audit + HTS USDC)
```

*(If the form only allows standard picks, select: **Solidity**, **viem**, **wagmi**, **ENS**, **Hardhat** or **Foundry**.)*

---

### Which blockchain networks will your project interact with?

```
Arc (Circle L1 — primary USDC settlement)
Hedera (HTS USDC + HCS audit receipts)
Ethereum (ENS resolution)
Arbitrum
Base
Optimism
Polygon
Any EVM chain supported by Dynamic Flow (cross-chain funding)
```

*(Minimum honest set: **Arc**, **Ethereum**, **Hedera**, plus any Flow source chains you demo — e.g. **Arbitrum**, **Base**.)*

---

### Which programming languages are you using in your project?

```
TypeScript
JavaScript
Solidity
Swift
```

---

### Are you using any web frameworks for your project?

```
Next.js
React
Tailwind CSS
```

---

### Are you using any databases for your project?

```
None (in-memory store for hackathon MVP)
```

*(Escrow/claim state uses an in-memory `EscrowStore` for zero-infra demo. Production path is Postgres/KV — do **not** claim a DB unless you wire one before submit.)*

---

### Are you using any design tools for your project?

```
Figma
Cursor (UI iteration)
```

*(Adjust if your team used something else — e.g. none, Sketch, Penpot.)*

---

### Other specific technologies, libraries, frameworks, or tools

```
@dynamic-labs/sdk-react-core
@dynamic-labs/ethereum
@hashgraph/sdk
@simplewebauthn/browser
@simplewebauthn/server
twilio
zod
vitest
pnpm
Vercel
Xcode / Messages framework / PassKit (iMessage extension)
OpenAI (Twilio Voice + NLP assist — if demoed)
HTTP 402 / x402 (agent micropayments)
PearPayEscrow.sol (Arc + Hedera EVM)
```

---

### Describe how AI tools were used in your project (if applicable)

```
Cursor — used throughout the hackathon for scaffolding, refactors, and documentation (README, Submission.md, contract comments). All payment-critical paths (escrow, Flow, signing, webhooks) were reviewed manually by the team before demo.

OpenAI — optional Twilio Voice demo path interprets spoken payment intent ("Send Alex twenty dollars"); NLP parser is primarily rule-based TypeScript in src/core/nlp/ with AI assist for edge-case phrasing during development.

No AI-generated code was submitted without human review. See AI_ATTRIBUTION.md in the repo for team scope and review notes.
```

*(Leave blank on the form only if your team prefers not to disclose — ETHGlobal allows blank.)*

---

## Judging & prizes

### Submission type

```
Top 10 Finalist & Partner Prizes
```

Select **Top 10 Finalist & Partner Prizes** — participate in main judging (Sunday live session) **and** partner judging for Arc, Dynamic, and Unlink.

**Live judging:** Sunday, June 14, 2026 at **2:30 PM EDT** — present live to the panel.

---

### Continuity Mode / track

```
Building from Scratch
```

Select **Building from Scratch** — Pear Pay is a new project built at ETHGlobal NYC 2026, not an extension of a pre-existing product.

*(Do **not** select Continuity Track unless the whole team is on that track and you have a genuine pre-event base project.)*

---

### Partner judging reminders

- Name the bounty explicitly in your submission and demo (e.g. "Submitting for Arc — Best Smart Contracts with Advanced Stablecoin Logic").
- Arc + joint Unlink prize require: **MVP + architecture diagram + video + public repo**.
- Dynamic requires: **deployed app judges can use** + SDK integration visible in demo.
- Unlink requires: **working private flow demo** + README explaining what is private.
- Keep `DYNAMIC_BOUNTY.md` open during the Dynamic booth / video — it has the judge demo script.

---
