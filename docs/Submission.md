# Pear Pay — ETHGlobal Submission

Answers for every field on the ETHGlobal project submission form, in **the same order as the website sidebar**.

> **Tip:** Click **Copy** on each field (works in browser preview), or select the code block below it. Reload this preview after edits so timestamps stay accurate.

<script>
function copyField(id, btn) {
  const text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(function () {
    const label = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(function () { btn.textContent = label; }, 2000);
  });
}
</script>

<style>
.copy-row { margin: 0.75rem 0 1.25rem; }
.copy-btn {
  cursor: pointer;
  font-size: 12px;
  padding: 4px 12px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f3f4f6;
}
.copy-btn:hover { background: #e5e7eb; }
.copy-target {
  background: #f9fafb;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.5;
}
.section-meta { color: #6b7280; font-size: 13px; margin-bottom: 1rem; }
</style>

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

<p class="section-meta"><strong>Last updated:</strong> 2026-06-13 14:52 EDT</p>

### Project name

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-project-name', this)">Copy</button>
<pre id="copy-project-name" class="copy-target">Pear Pay</pre>
</div>

### What category does your project belong to?

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-category', this)">Copy</button>
<pre id="copy-category" class="copy-target">Wallet/Payments</pre>
</div>

### What emoji best represents your project?

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-emoji', this)">Copy</button>
<pre id="copy-emoji" class="copy-target">🍐</pre>
</div>

### If you have a demonstration, link to it here!

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-demo-link', this)">Copy</button>
<pre id="copy-demo-link" class="copy-target">https://pearpay.app/</pre>
</div>

### Short description *(max 100 characters)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-short-desc', this)">Copy</button>
<pre id="copy-short-desc" class="copy-target">The Apple Pay for Web3: send crypto in any messaging app using natural language.</pre>
</div>

*(96 characters. Alternates:)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-short-desc-alt1', this)">Copy alt 1</button>
<pre id="copy-short-desc-alt1" class="copy-target">Send money in any chat. Pear Pay turns plain English into private, chain-abstracted USDC payments.</pre>
</div>

### Description *(min 280 characters)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-description', this)">Copy</button>
<pre id="copy-description" class="copy-target">Pear Pay is a conversational payment protocol that lets you send money anywhere you communicate — iMessage, Telegram, WhatsApp, Discord, Slack, X, or even between AI agents. Instead of wallets, seed phrases, chains, bridges, swaps, and gas, you just express intent: "Send Molly $20," "Pay Alex back for dinner," or "Send Sarah 50 USDC privately."

Behind that single message, Pear Pay resolves the recipient (ENS name, phone, email, handle, or existing Pear Pay user), picks the optimal settlement rail, settles in USDC, and optionally shields the transfer so amounts and counterparties stay private. Every payment writes a tamper-proof audit receipt to the Hedera Consensus Service.

Crucially, payments never fail because the recipient hasn't onboarded. If they have no wallet, Pear Pay escrows the USDC and delivers a claim link over SMS/WhatsApp via Twilio; the recipient taps it, an embedded wallet is created instantly through Dynamic, and the funds release — solving the cold-start problem that kills most crypto payment apps.

Pear Pay also extends to the agentic economy: AI agents get their own ENS identity and Dynamic server wallet and can pay each other for APIs, compute, and data autonomously using HTTP 402 / x402 — the same infrastructure that powers human payments powering machine-to-machine commerce.

You can try it live at https://pearpay.app/: a clickable, screen-recordable Simulator reproduces the in-chat payment experience across six platforms (iMessage, Telegram, Discord, WhatsApp, Slack, X), and a "Try it" page does a real on-chain USDC transfer from your own wallet on Base Sepolia testnet — a genuine, verifiable transaction, not a mock.</pre>
</div>

### How it's made *(min 280 characters)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-how-made', this)">Copy</button>
<pre id="copy-how-made" class="copy-target">Pear Pay is one unified TypeScript app: a Next.js (App Router) frontend + API that orchestrates every integration, with a thin native Swift iMessage extension where Apple requires it.

The brain is a dependency-free core in TypeScript so it behaves identically across every channel: an NLP parser turns "Send Molly $20 privately" into a structured PaymentIntent; a universal recipient resolver maps ENS / phone / email / handle / existing-user to a delivery mode; a programmable escrow handles claimable payments; and a settlement orchestrator selects the rail per payment and serializes a JSON-safe result for the UI. Blockchain access is via viem/wagmi.

Two demo surfaces show this end to end: (1) a screen-recordable Simulator that reproduces the real in-chat UX across six platforms (iMessage, Telegram, Discord, WhatsApp, Slack, X) — pixel-faithful phone frame, on-screen iOS keyboard, and each platform's native confirmation pattern (Apple Pay sheet, Telegram inline buttons, Discord embeds, WhatsApp quick-replies, Slack Block Kit, X cards) — all sharing one tested component foundation; and (2) a live "Try it" page that does a REAL on-chain USDC transfer on Base Sepolia: connect a browser wallet via wagmi (injected connector), and transfer() Circle's testnet USDC to any address with a verifiable BaseScan link — no sponsor accounts or funded server keys required.

Partner tech and how it helps:
- Dynamic — embedded wallets for instant onboarding-on-claim and server/agent wallets for autonomous payments; powers login + signing.
- ENS — human-readable identity and recipient discovery for both people and AI agents (forward/reverse resolution + ENSIP-26 text records for agent endpoints).
- Hedera — primary settlement rail: USDC via the Hedera Token Service (HTS), and a tamper-proof, ordered audit receipt for every payment/escrow/claim via the Hedera Consensus Service (HCS). Sub-cent fees + 3–5s finality make conversational and nano payments viable.
- Arc (Circle) — Circle-native USDC settlement and chain-abstracted liquidity for the Arc rail.
- Unlink — private transfers via the real @unlink-xyz/sdk client (createUnlink + unlinkAccount.fromMnemonic, primitives deposit/transfer/withdraw) so balances, amounts, and counterparties stay hidden in "private mode."
- Twilio — SMS/WhatsApp claim-link delivery + Verify; this is what reaches recipients who don't have a wallet yet and solves the cold-start problem.

On-chain, PearPayEscrow.sol is a programmable USDC/EURC escrow (conditional release behind a keccak256 claim-secret, time-based auto-refund, sender cancellation) designed to deploy to both Arc and Hedera's EVM (Smart Contract Service) from the same bytecode.

Hacky / notable bits:
- A "rail selector" replaces cross-chain bridging — Pear Pay treats Hedera/Arc/Unlink as one settlement surface and picks the best one, while still abstracting chains away from the user.
- Claim links unfurl as rich payment cards in iMessage via a dynamic Next.js opengraph-image (1200×630) generated per pay-link.
- "Pay with Face ID" uses WebAuthn passkeys (@simplewebauthn) for biometric approval in the browser.
- Agent-to-agent payments use HTTP 402 / x402 with a Dynamic server wallet — no human in the loop.
- Every settlement also emits an HCS receipt, giving an immutable audit trail for human and machine transactions.
- The "Try it" page is genuinely on-chain: wagmi + an injected browser wallet send a real Circle USDC transfer() on Base Sepolia (chain 84532) with a BaseScan receipt — judges can verify an actual transaction with zero sponsor credentials.
- The Simulator is one reusable foundation: a shared PhoneFrame, a theme-aware on-screen IosKeyboard, and a shared PearPayCard, with each of the six channel components layering on its platform-native chrome and confirmation flow.

The sponsor settlement rails (Hedera/Arc/Unlink) run in sandbox/testnet mode for the demo so the full flow is reproducible without funded mainnet keys, while the "Try it" page is live on Base Sepolia.</pre>
</div>

### GitHub Repositories

**Select:** `mollybeach/pearpay` · label **Primary** · **Monorepo**

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-github', this)">Copy URL</button>
<pre id="copy-github" class="copy-target">https://github.com/mollybeach/pearpay</pre>
</div>

---

## 2. Images

<p class="section-meta"><strong>Last updated:</strong> 2026-06-13 14:52 EDT</p>

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

<p class="section-meta"><strong>Last updated:</strong> 2026-06-13 14:52 EDT</p>

Copy each multiselect block into the matching ETHGlobal dropdown.

### Are you using any Ethereum developer tools?

**Select ONLY:** Foundry, Reown

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-eth-tools', this)">Copy</button>
<pre id="copy-eth-tools" class="copy-target">Foundry
Reown</pre>
</div>

### Which blockchain networks will your project interact with?

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-networks', this)">Copy</button>
<pre id="copy-networks" class="copy-target">Arc
Hedera
Ethereum
Arbitrum
Base
Optimism
Polygon</pre>
</div>

**Do not select:** `Flow` (Dapper blockchain — not Fireblocks Flow), `None`, or chains with no code integration.

### Which programming languages are you using?

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-languages', this)">Copy</button>
<pre id="copy-languages" class="copy-target">TypeScript
JavaScript
Solidity
Swift
Node.js</pre>
</div>

### Are you using any web frameworks?

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-web-frameworks', this)">Copy</button>
<pre id="copy-web-frameworks" class="copy-target">Next.js
React.js</pre>
</div>

### Are you using any databases?

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-databases', this)">Copy</button>
<pre id="copy-databases" class="copy-target">None</pre>
</div>

### Are you using any design tools?

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-design-tools', this)">Copy</button>
<pre id="copy-design-tools" class="copy-target">None</pre>
</div>

### Other specific technologies *(free-text multiselect — one per line)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-other-tech', this)">Copy</button>
<pre id="copy-other-tech" class="copy-target">viem
wagmi
ENS
Dynamic SDK
Fireblocks Flow
Circle Arc
Unlink SDK
Hedera SDK
Twilio
WebAuthn
HTTP 402
Tailwind CSS
npm
Vercel
Xcode
zod
vitest
Cursor</pre>
</div>

### Describe how AI tools were used *(if applicable)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-ai', this)">Copy</button>
<pre id="copy-ai" class="copy-target">Cursor — used throughout the hackathon for scaffolding, refactors, and documentation (README, Submission.md, contract comments). All payment-critical paths (escrow, Flow, signing, webhooks) were reviewed manually by the team before demo.

OpenAI — optional Twilio Voice demo path interprets spoken payment intent ("Send Alex twenty dollars"); NLP parser is primarily rule-based TypeScript in src/core/nlp/ with AI assist for edge-case phrasing during development.

No AI-generated code was submitted without human review. See AI_ATTRIBUTION.md in the repo for team scope and review notes.</pre>
</div>

---

## 4. Select prizes

<p class="section-meta"><strong>Last updated:</strong> 2026-06-13 14:52 EDT</p>

### Continuity Mode

**Select:** Building from Scratch

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-continuity', this)">Copy</button>
<pre id="copy-continuity" class="copy-target">Building from Scratch</pre>
</div>

### Submission type

**Select:** Top 10 Finalist & Partner Prizes

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-submission-type', this)">Copy</button>
<pre id="copy-submission-type" class="copy-target">Top 10 Finalist & Partner Prizes</pre>
</div>

**Live judging:** Sunday, June 14, 2026 at **2:30 PM EDT**.

### Which partner prizes are you applying for?

**Check these three:** Arc ($15,000) · Dynamic ($10,000) · Unlink ($5,000)

### Which other partners' technologies have you used?

**Select:** Hedera *(not applying for Hedera prize — used for HTS + HCS)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-other-partners', this)">Copy</button>
<pre id="copy-other-partners" class="copy-target">Hedera</pre>
</div>

---

### Arc — $15,000

#### How are you using this Protocol / API? *(1–2 sentences)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-arc-usage', this)">Copy</button>
<pre id="copy-arc-usage" class="copy-target">Pear Pay uses Arc as its default USDC settlement and liquidity hub. Users never pick a chain — they send a message like "Pay Alex $20" and Pear Pay routes funds to Arc via PearPayEscrow.sol (conditional claim-secret release, expiry refund, sender cancel) and chain-abstracted settlement through our Arc integration. Claimable payments escrow USDC on Arc until the recipient onboards via Dynamic and claims.</pre>
</div>

#### Link to the line of code where the tech is used

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-arc-code', this)">Copy</button>
<pre id="copy-arc-code" class="copy-target">https://github.com/mollybeach/pearpay/blob/main/contracts/PearPayEscrow.sol#L68-L74
https://github.com/mollybeach/pearpay/blob/main/src/integrations/arc/index.ts#L67-L75
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L78-L90</pre>
</div>

#### How easy is it to use? *(1–10)*

**Select:** `8`

#### Additional feedback for the Sponsor

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-arc-feedback', this)">Copy</button>
<pre id="copy-arc-feedback" class="copy-target">Arc's USDC-native model maps cleanly to conversational payments — one settlement surface, no chain picker in UX. Foundry deploy + Arc testnet USDC address were straightforward. Circle Gateway/Forwarder for live source-to-Arc routing would benefit from a single end-to-end TypeScript example (detect source chain → quote → settle on Arc) in the docs; we scaffolded this in src/integrations/arc/ but had to infer request shapes from scattered Circle docs. A canonical "claimable escrow on Arc" reference repo would help hackathon teams ship faster.</pre>
</div>

**Bounty tracks to name in demo:** Best Smart Contracts on Arc with Advanced Stablecoin Logic · Best Chain Abstracted USDC Apps Using Arc as a Liquidity Hub

---

### Dynamic — $10,000

#### How are you using this Protocol / API? *(1–2 sentences)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-dynamic-usage', this)">Copy</button>
<pre id="copy-dynamic-usage" class="copy-target">Pear Pay uses Dynamic for embedded wallet onboarding when recipients claim funds (no seed phrases), Fireblocks Flow for cross-chain checkout that settles USDC on Arc, and server wallets for autonomous agent payments (HTTP 402 / x402). Human path: NLP → WebAuthn Face ID → Flow checkout → Arc. Agent path: natural-language intent → Dynamic server wallet → pay gated API → retry on 402.</pre>
</div>

#### Link to the line of code where the tech is used

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-dynamic-code', this)">Copy</button>
<pre id="copy-dynamic-code" class="copy-target">https://github.com/mollybeach/pearpay/blob/main/src/components/Providers.tsx#L13-L21
https://github.com/mollybeach/pearpay/blob/main/app/api/flow/payment/start/route.ts#L46-L50
https://github.com/mollybeach/pearpay/blob/main/src/integrations/dynamic/index.ts#L86-L112
https://github.com/mollybeach/pearpay/blob/main/src/integrations/dynamic/index.ts#L118-L133
https://github.com/mollybeach/pearpay/blob/main/app/api/agent/run-intent/route.ts#L36-L42</pre>
</div>

#### How easy is it to use? *(1–10)*

**Select:** `9`

#### Additional feedback for the Sponsor

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-dynamic-feedback', this)">Copy</button>
<pre id="copy-dynamic-feedback" class="copy-target">Dynamic SDK integration for embedded wallets and auth was smooth — Providers + wallet button worked in under an hour. Flow's multi-step checkout (create → source → quote → prepare → broadcast → webhook) is powerful but dense; a single "happy path" sequence diagram with expected JSON payloads per step would reduce integration time. Server wallet REST API for agentic x402 flows is a strong differentiator — clearer docs on signing/submitting txs from server wallets (not just creating them) would unlock more agent builds.</pre>
</div>

**Bounty tracks to name in demo:** Best Use of Flow · Best Agentic Build · Best Overall Use · Best Private Nanopayments App *(joint with Unlink + Arc)*

---

### Unlink — $5,000

#### How are you using this Protocol / API? *(1–2 sentences)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-unlink-usage', this)">Copy</button>
<pre id="copy-unlink-usage" class="copy-target">Pear Pay adds an optional private payment mode: users say "Send Sarah 50 USDC privately" and the orchestrator routes through Unlink's deposit/transfer/withdraw primitives so balances, amounts, and counterparties stay hidden while Arc still settles the public leg when needed. Private rail selection is automatic when isPrivate is set — no separate UX for shielding.</pre>
</div>

#### Link to the line of code where the tech is used

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-unlink-code', this)">Copy</button>
<pre id="copy-unlink-code" class="copy-target">https://github.com/mollybeach/pearpay/blob/main/src/integrations/unlink/index.ts#L57-L74
https://github.com/mollybeach/pearpay/blob/main/src/integrations/unlink/index.ts#L98-L126
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L27-L28
https://github.com/mollybeach/pearpay/blob/main/src/core/payments/settlement.ts#L68-L76</pre>
</div>

#### How easy is it to use? *(1–10)*

**Select:** `9`

#### Additional feedback for the Sponsor

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-unlink-feedback', this)">Copy</button>
<pre id="copy-unlink-feedback" class="copy-target">Unlink's privacy primitives (deposit → private transfer → withdraw) fit naturally as a "private mode" toggle on top of conversational payments. Local stub mode made hackathon development fast. For production, clearer docs on how private balances interact with USDC on Arc (settlement timing, fee model, and error codes on failed shield/transfer) would help. A minimal Next.js example showing one private peer-to-peer transfer end-to-end would complement the SDK reference.</pre>
</div>

**Bounty tracks to name in demo:** Best Private Nano Payment App *(joint)* · Best Unlink Integration into a Major Open-Source App

---

## 5. Video

<p class="section-meta"><strong>Last updated:</strong> 2026-06-13 14:52 EDT</p>

### Demo video requirements

- Format: `.mp4` or `.mov`
- Length: **2–4 minutes**
- Resolution: minimum **720p**
- Audio: required; **no background music**
- No speed-ups (per project rules)

### Demo video link *(paste when uploaded)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-video', this)">Copy</button>
<pre id="copy-video" class="copy-target">TODO: add the recorded demo link before final submission</pre>
</div>

**Suggested demo script:** see `docs/DYNAMIC_BOUNTY.md` and `docs/ARC_BOUNTY.md`.

**Cover in the video:**

1. Simulator — "Send Molly $20" across a messaging app
2. Try it — real Base Sepolia USDC transfer + BaseScan link
3. Arc escrow lifecycle + Flow checkout (if credentialed)
4. Private mode mention (Unlink) + agent x402 path (Dynamic server wallet)

---

## 6. Future

<p class="section-meta"><strong>Last updated:</strong> 2026-06-13 14:52 EDT</p>

*(Use this if the form asks about future plans / what happens after the hackathon.)*

<div class="copy-row">
<button class="copy-btn" type="button" onclick="copyField('copy-future', this)">Copy</button>
<pre id="copy-future" class="copy-target">After ETHGlobal NYC, Pear Pay will ship production escrow persistence (Postgres/KV), live Circle Gateway settlement on Arc, and Twilio claim delivery at scale. The iMessage extension moves from preview to TestFlight. Agent payments expand beyond the x402 demo to a marketplace where ENS-named agents discover and pay each other for APIs, compute, and data — all through the same conversational interface humans use. Private mode via Unlink becomes a one-tap default for sensitive transfers.</pre>
</div>

---

## 7. Final

<p class="section-meta"><strong>Last updated:</strong> 2026-06-13 14:52 EDT</p>

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
