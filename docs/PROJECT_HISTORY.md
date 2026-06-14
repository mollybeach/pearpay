# PearPay — Complete Project & Chat History

**Document created:** Saturday, June 13, 2026 (continued into June 14, 2026 UTC)  
**Event:** ETHGlobal NYC 2026 Hackathon  
**Team:** Priyansh Shah + Molly Beach  
**Live app:** https://pearpay.app  
**GitHub repo:** https://github.com/mollybeach/pearpay  
**Judging:** Sunday, June 14, 2026 · 2:30 PM EDT  
**Submission deadline:** Sunday, June 14, 2026 · 9:00 AM (internal team target)

This document is a line-by-line chronicle of everything discussed and built in the Cursor chat session with Priyansh, plus the PearPay codebase evolution on GitHub through the end of Phase P0 stabilization.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Team, Tools, and Repository Layout](#2-team-tools-and-repository-layout)
3. [Prize Targets](#3-prize-targets)
4. [Complete Chat History (Chronological)](#4-complete-chat-history-chronological)
5. [PearPay Product Vision (Original Blueprint)](#5-pearpay-product-vision-original-blueprint)
6. [Codebase Evolution — Molly's App (pearpay-molly)](#6-codebase-evolution--mollys-app-pearpay-molly)
7. [Codebase Evolution — Priyansh's Cursor Build (parent pearpay/)](#7-codebase-evolution--priyanshs-cursor-build-parent-pearpay)
8. [Merge Story: Two Apps → One App](#8-merge-story-two-apps--one-app)
9. [Pull Request History](#9-pull-request-history)
10. [Integration Status Matrix](#10-integration-status-matrix)
11. [Environment Variables — What Is Set vs Missing](#11-environment-variables--what-is-set-vs-missing)
12. [Known Bugs, Fixes, and Blockers](#12-known-bugs-fixes-and-blockers)
13. [Phase P0 Stabilization (Latest Work)](#13-phase-p0-stabilization-latest-work)
14. [Two-Person Work Division Plan](#14-two-person-work-division-plan)
15. [Git Setup Fix (Nested Repos)](#15-git-setup-fix-nested-repos)
16. [File & Directory Map (Current App)](#16-file--directory-map-current-app)
17. [Verification Scripts & Commands](#17-verification-scripts--commands)
18. [What Is Left Before Judging](#18-what-is-left-before-judging)
19. [Appendix: Key URLs and Docs](#19-appendix-key-urls-and-docs)

---

## 1. Executive Summary

PearPay (branded **Pear Pay** in UI/docs) is a conversational USDC payment app for ETHGlobal NYC 2026. Users type natural-language payment intents in messaging apps (iMessage, WhatsApp, Telegram, Slack, Discord, X) or via web/API. The app resolves recipients, routes payments through sponsor SDKs, and presents an Apple Pay-style experience with Face ID, Open Graph pay links, and chain abstraction.

**Total prize pool targeted:** ~$30,000 across three sponsors:
- **Arc (Circle):** $15,000
- **Dynamic:** $10,000
- **Unlink:** $5,000

**Progress estimate (as of end of chat):**
- **Built in code:** ~68% of the grand ZK/agentic blueprint
- **Live / demo-ready:** ~45% (blocked mainly by dashboard credentials and a few env vars)
- **Unit tests:** 70 passing, 2 skipped (live Arc/Unlink tests)
- **Production build:** Passes with warnings (wagmi/metamask optional deps)

**Canonical repo going forward:** `pearpay-molly/` inside `/Users/priyansh/Desktop/pearpay/` — all git operations happen there.

---

## 2. Team, Tools, and Repository Layout

### Team

| Person | Role | Primary tool | Owns (planned split) |
|--------|------|--------------|----------------------|
| **Priyansh Shah** | Dynamic / Flow / Agent / Deploy / Pay UX | Cursor Composer 2.5 Fast | Dynamic track, SSR, Flow E2E, agent x402, Vercel |
| **Molly Beach** | Arc / Unlink / Orchestrator / Contracts | Claude Code (LingCode) | Arc escrow, Unlink privacy, settlement, GitHub issues |

### Tools used across the project

| Tool | Used by | Purpose |
|------|---------|---------|
| **Cursor Pro** | Priyansh | Initial monorepo scaffold (`web/`, `engine/`), merge planning, Dynamic integration, Phase P0 |
| **LingCode** | Molly | Primary development of unified Next.js app in `pearpay-molly/` |
| **Claude Code** | Molly (planned) | Arc/Unlink deep integration work |
| **Dynamic MCP** | Priyansh | `https://www.dynamic.xyz/docs/mcp` for Flow/agent docs |
| **Foundry** | Molly | `PearPayEscrow.sol` contract tests |
| **Vitest** | Both | 70+ unit/integration tests |
| **Vercel** | Both | Production deploy target for https://pearpay.app |
| **GitHub** | Both | https://github.com/mollybeach/pearpay |

### Local folder layout on Priyansh's machine

```
/Users/priyansh/Desktop/pearpay/          ← Cursor workspace root
├── .vscode/settings.json                 ← Added to detect nested git repo
├── engine/                               ← Priyansh's FastAPI backend (legacy, not canonical)
├── web/                                  ← Priyansh's Next.js app (legacy, not canonical)
├── scripts/                              ← Priyansh's root scripts (legacy)
├── README.md, PHASES.md, etc.            ← Priyansh's root docs (legacy)
└── pearpay-molly/                        ← ★ CANONICAL REPO ★ (git root)
    ├── app/                              ← Next.js App Router pages + API routes
    ├── src/                              ← Core logic, integrations, components
    ├── contracts/                        ← PearPayEscrow.sol (Foundry)
    ├── docs/                             ← Bounty briefs, judging, env setup
    ├── scripts/                          ← verify:* and judge:demo scripts
    ├── tests/                            ← Vitest test suite
    ├── .env                              ← Local secrets (gitignored, never committed)
    └── package.json                      ← npm scripts; run all commands from here
```

**Important:** Always `cd pearpay-molly` before `npm run dev`, `npm test`, or git commands. Running `npm run dev` from parent `pearpay/` fails with `ENOENT` on `package.json`.

---

## 3. Prize Targets

### Arc — $15,000

| Track | Prize | PearPay proof |
|-------|-------|---------------|
| Best Smart Contracts on Arc with Advanced Stablecoin Logic | $3,500 | `contracts/PearPayEscrow.sol` — escrow, claim, refund, cancel |
| Best Chain Abstracted USDC Apps Using Arc as Liquidity Hub | $3,500 | Orchestrator defaults to Arc chain `5042002`; users never pick chain |
| *(Additional Arc pool tracks)* | — | Documented in `docs/ARC_BOUNTY.md` |

**Verify:** `npm run verify:arc` → escrows 0.01 USDC, claims, prints ArcScan URLs

### Dynamic — $10,000

| Track | Prize | PearPay proof |
|-------|-------|---------------|
| Best Use of Flow | $3,000 | 8-step Flow API via `/api/flow/payment/*` |
| Best Agentic Build | $2,000 | Server wallet + `/api/agent/run-intent` + x402 pay |
| Best Money App | $2,000 | Conversational pay + embedded wallets |
| Best Wallet Glow Up | $2,000 | Dynamic embedded wallet UX |
| Best Private Nanopayments App (joint w/ Unlink + Arc) | $2,000 / $1,000 | Mention Unlink + Arc in same demo |

**Verify:** `npm run verify:dynamic` + browser Flow demo + agent demo

### Unlink — $5,000

| Track | Prize | PearPay proof |
|-------|-------|---------------|
| Best Private Nano Payment App (joint) | $2,000 / $1,000 | `"Send X USDC privately"` → Unlink rail |
| Best Unlink Integration into Major Open-Source App | $2,500 | Real SDK on Arc testnet engine |

**Verify:** `npm run verify:unlink` + `/messages` private send UI

---

## 4. Complete Chat History (Chronological)

Every user message from the Cursor chat session, in order, with what was done in response.

---

### Query 1 — Master Blueprint (Friday, Jun 12)

**User asked:** Shared the full "PearPay: Master Project Blueprint and Systems Architecture for the Agentic Economy" document — a comprehensive ZK/agentic payment gateway design covering NLP, WebAuthn, Dynamic Flow, Unlink privacy pools, Arc x402 GatewayClient, BurnerWallet delegation, Circle EIP-3009, multi-channel messaging, etc.

**Assistant did:**
- Explored empty workspace at `/Users/priyansh/Desktop/pearpay`
- Synthesized architecture, execution priorities, risks for two-person team
- Noted Classic Track Integrity rule (no VCS before 9 PM EDT Friday)

**Outcome:** Blueprint established as north star; workspace was empty at that moment.

---

### Query 2 — Hackathon War Plan / Phases

**User asked:** "If you were at ETHGlobal NYC and had to win — create phases to focus on one by one, hard deadline 9 AM Sunday."

**Assistant did:**
- Created **PearPay War Plan: Friday → Sunday 9:00 AM**
- Defined the one demo sentence: *Text intent → rich pay card → FaceID → Arc tx hash*
- **Phase 0:** Launch lock (repo, roles, keys)
- **Phase 1:** OG unfurl + pay link
- **Phase 2:** WebAuthn/FaceID
- **Phase 3:** Dynamic Flow
- **Phase 4:** Agent x402
- **Phase 5:** Twilio claim + deploy + video

**Outcome:** Phase framework used throughout the hackathon.

---

### Query 3 — Scaffold All Phases

**User asked:** "Start finishing all the phases then we will work on individual ones."

**Assistant did (major scaffold in parent `pearpay/`):**
- Created monorepo root: `AI_ATTRIBUTION.md`, `.env.example`, `README.md`, `PHASES.md`
- Built **`engine/`** FastAPI backend: parser, webhooks, x402 stubs, Twilio stubs
- Built **`web/`** Next.js app:
  - `Providers.tsx` with Dynamic SDK
  - `PaymentFlow.tsx`, `PaymentCard.tsx`, `DynamicWalletButton.tsx`
  - `usePayment.ts`, `useWebAuthn.ts`, `useFlowPayment.ts` hooks
  - `/pay/[data]` page with OG metadata
  - WebAuthn API routes
  - Agent demo stub
  - x402 routes

**Outcome:** Priyansh's Cursor-built monorepo (`web/` + `engine/`) — functional scaffold, not the final canonical app.

---

### Query 4 & 5 — Dynamic Flow Bounty Context

**User shared:** Dynamic "Best Use of Flow" ($3,000) bounty description — merchant acceptance, iGaming, agentic deposits, POS, etc. Link: https://www.dynamic.xyz/docs/overview/fireblocks-flow

**Assistant did:** Mapped bounty requirements to PearPay's Flow integration design.

---

### Query 6 — Pull/Push Molly's Repo

**User asked:** Repo is https://github.com/mollybeach/pearpay — pull and push what's done, don't push private work, tell what needs updating.

**Assistant did:**
- Cloned/fetched Molly's repo
- Identified differences between local Cursor work and GitHub
- Listed env vars and integration gaps
- Did not commit `.env` or secrets

---

### Query 7 — Should I Edit Partner's App Entirely?

**User asked:** Partner already worked on it — do I edit it entirely?

**Assistant answered (Ask mode):**
- No — don't rewrite Molly's app
- Integrate your unique pieces into her repo
- She has broader scope (Arc, Unlink, channels, contracts, iOS)

---

### Query 8 — Merge Strategy (Both Built Same App)

**User asked:** Both built entire apps; add what she's lacking from mine; if mine is better in places, use mine; work on same thing.

**Assistant answered:** Merge strategy — her repo as base, cherry-pick Cursor strengths (Flow wiring, WebAuthn polish, agent routes).

---

### Query 9 — Two Parallel Apps Clarification

**User asked:** She built with LingCode, I built with Cursor Pro — two apps, same concept, different logic, both work.

**Assistant answered:** Confirmed dual-codebase situation; recommended unified repo on GitHub.

---

### Query 10 — Clone and Compare

**User asked:** Clone https://github.com/mollybeach/pearpay ; find differences and similarities.

**Assistant did:**
- Cloned `pearpay-molly/` from Molly's repo
- Compared file structures, integrations, test coverage
- Molly's app: unified Next.js, Arc escrow, Unlink, 6-channel simulators, Foundry contracts, iOS layer
- Priyansh's app: monorepo with separate FastAPI engine, simpler web frontend

**Conclusion:** Molly's app has significantly more features and sponsor integrations.

---

### Query 11 & 12 — Folder Ownership Clarification

**User asked:** Everything except `pearpay-molly` folder is what I built through Cursor.

**Assistant confirmed:**
- `pearpay-molly/` = Molly's canonical app (GitHub)
- Parent folders (`web/`, `engine/`, etc.) = Priyansh's Cursor build

---

### Query 13 — Is Her App Better? Sync Both?

**User asked:** Is her app better? Need to synchronize and merge ideas into best app.

**Assistant answered:**
- Yes, Molly's app is more complete for hackathon judging
- Priyansh's contributions worth merging: Flow client depth, WebAuthn, agent x402, Dynamic wagmi connector
- Strategy: merge into her repo, not maintain two apps

---

### Query 14 — One App Only — Full Merge Plan

**User asked:** Only one app at end; add everything I'm lacking in hers; she has more features; safely integrate my build into her latest GitHub commits; work on her repo only going forward.

**Assistant did:**
- Created detailed merge plan
- Identified files to port from Cursor `web/` → Molly `pearpay-molly/`
- Planned branch `integration/cursor-flow-agent` or similar

---

### Query 15 & 16 — Execute Merge Plan

**User asked:** "Merge Cursor Work Into Molly's PearPay — implement the plan, complete all todos."

**Assistant did (Agent mode):**
- Created integration branch
- Ported Dynamic provider + wagmi connector
- Ported Flow API routes and client
- Ported WebAuthn hooks and routes
- Ported agent x402 demo and server wallet stubs
- Ported payment flow UI improvements
- Ran tests, fixed conflicts
- Opened Pull Request

**Outcome:** Major merge of Priyansh's Dynamic/Flow/agent work into Molly's codebase.

---

### Query 17 — No Cursor Branding / Verify Merge Success

**User asked:** Don't show Cursor anywhere; verify everything integrated safely; both ideas merged; don't reduce what she built; integrate my better pieces; when to switch to Agent mode?

**Assistant answered (Ask mode):**
- `AI_ATTRIBUTION.md` mentions Cursor — can be edited to generic wording
- Merge was mostly additive
- Recommended Agent mode to push final integration PR
- Confirmed: treat as one app, not "merged app"

---

### Query 18 — Do Everything

**User asked:** "do everything"

**Assistant did (Agent mode):**
- Completed remaining merge todos
- Fixed attribution wording
- Pushed integration branch
- Verified tests pass

---

### Query 19 — Merge the PR?

**User asked:** Should I merge the pull request?

**Assistant answered:** Yes, after CI/tests green; merge to `main` then both pull latest.

---

### Query 20 — Confirm pearpay-molly Only + Latest Commits

**User asked (Sat Jun 13, 12:36 PM):** Work only on pearpay-molly; confirm my stuff was added; getting latest commits?

**Assistant did:**
- `git fetch origin && git pull origin main`
- Confirmed Dynamic/Flow/agent pieces from Cursor merge present
- Listed what was integrated vs still stub

---

### Query 21 — Pull/Push Game on Her Repo Only

**User asked:** Only pull/push on her repo going forward.

**Assistant confirmed:** `pearpay-molly/` is the single source of truth; parent Cursor folders are legacy reference only.

---

### Query 22 — Fix All GitHub Issues

**User asked:** Fix all issues at https://github.com/mollybeach/pearpay/issues

**Assistant did:**
- Audited open GitHub issues
- Fixed Arc-related issues (env config, CI, stablecoin addresses)
- Fixed documentation issues
- Closed issues with PR references where applicable

---

### Query 23 — Arc Bounty Focus

**User shared:** Full Arc ($15,000) bounty requirements — Smart Escrow, chain abstraction, Circle Forwarder, liquidity hub.

**Assistant did:**
- Mapped to `PearPayEscrow.sol` and `src/integrations/arc/`
- Updated `docs/ARC_BOUNTY.md`
- Planned `npm run verify:arc` script

---

### Query 24 & 25 — Subagent Completion Acknowledgments

System messages — no user action required.

---

### Query 26 — Arc Issues Only + Human Checklist

**User asked (Sat Jun 13, 1:04 PM):** Fix Arc GitHub issues only; tell me human tasks (accounts, keys); what to ask Arc team; complete all Arc integration first.

**Assistant did:**
- Fixed Arc env schema, escrow wiring, verify script
- Created human checklist:
  - Circle developer account → `CIRCLE_API_KEY`
  - Arc testnet faucet → fund `FUNDER_PRIVATE_KEY`
  - Deploy escrow → `ARC_ESCROW_CONTRACT_ADDRESS`
  - Questions for Arc booth about Gateway/Forwarder live credentials

**Branch work:** `integration/arc-escrow-live` → merged as PR #26

---

### Query 27–34 — Dynamic Integration Planning & Execution

**User asked:** Wire Dynamic packages, implement live Flow, agent x402, dashboard setup.

**Assistant did:**
- Installed: `@dynamic-labs/sdk-react-core`, `@dynamic-labs/ethereum`, `@dynamic-labs/wagmi-connector`, `wagmi`, `@tanstack/react-query`, `@dynamic-labs-wallet/node-evm`
- Implemented full Flow 8-step API in `src/integrations/flow/client.ts`
- Created `/api/flow/payment/*` routes
- Implemented persistent Flow session store (`.flow-store.json`)
- Implemented HMAC webhook verification at `/api/webhooks/flow`
- Implemented Dynamic server wallet in `src/integrations/dynamic/server-wallet.ts`
- Implemented real x402 signing in `src/lib/x402.ts`
- Created `docs/DYNAMIC_SETUP.md`, updated `docs/DYNAMIC_BOUNTY.md`
- Added tests: `flow-store.test.ts`, `flow-client.test.ts`, `x402.test.ts`
- Added `scripts/verify-dynamic.mjs`

**Branch:** `integration/dynamic-live` → **PR #27 MERGED**

---

### Query 35 & 36 — Dynamic Live Integration Plan Execution

**User asked:** Implement Dynamic Live Integration Plan todos completely.

**Assistant completed todos:**
- [x] Sync main and branch from latest remote
- [x] Document Dynamic dashboard setup in `docs/DYNAMIC_SETUP.md`
- [x] Replace in-memory Flow session Maps with persistent store
- [x] Audit Flow client against 8-step API spec
- [x] Harden `PaymentFlow` / `useFlowPayment`
- [x] Polish Flow webhook HMAC verify
- [x] Add `@dynamic-labs-wallet/node-evm` server wallet
- [x] Replace fake X-Payment with real x402 signed payment
- [x] Add Flow/agent tests and update docs
- [x] Run local Flow + agent verification attempts

---

### Query 37 & 38 — npm install Dynamic Packages

**User ran:**
```bash
npm i viem @dynamic-labs/wagmi-connector wagmi @tanstack/react-query @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```
**Result:** 1609 packages, 71 audit vulnerabilities (moderate/high — not fixed yet)

**Assistant noted:** Packages installed successfully; run from `pearpay-molly/` directory.

---

### Query 39 — Dynamic Snippet with Environment ID

**User shared:**
```tsx
<DynamicContextProvider
  settings={{
    environmentId: "97d417fe-632b-4de8-8e2d-9fd56ec98949",
    walletConnectors: [EthereumWalletConnectors],
  }}
>
  <DynamicWidget />
</DynamicContextProvider>
```

**Assistant did:** Wired into `Providers.tsx` with env var `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`.

---

### Query 40 — Comprehensive .env for Entire Project

**User asked:** Add all needed env vars to `.env`, leave blanks for missing keys.

**Assistant did:**
- Audited `src/lib/env.ts` zod schema
- Populated `.env` with all sponsor sections (Dynamic, Arc, Unlink, Twilio, WebAuthn, x402)
- Created/updated `.env.example` and `docs/ENV_SETUP.md`

---

### Query 41 — What's Missing for Dynamic?

**User asked:** Tell me everything about Dynamic that is missing.

**Assistant answered:**
- Missing: `DYNAMIC_WALLET_PASSWORD` (agent server wallet MPC)
- Missing/optional: `DYNAMIC_FLOW_CHECKOUT_ID`, `DYNAMIC_FLOW_WEBHOOK_SECRET`
- Dashboard: enable Flow, Arc Testnet 5042002, embedded wallets, Base/Ethereum source chains
- Fixed: leading space after `=` on `DYNAMIC_API_TOKEN` in `.env`

---

### Query 42 — Dynamic MCP Config

**User shared:**
```json
{ "dynamic": { "url": "https://www.dynamic.xyz/docs/mcp" } }
```

**Assistant did:** Documented MCP setup in `docs/DYNAMIC_SETUP.md` for Cursor and Claude Code.

---

### Query 43 — Pull Latest from GitHub

**User asked:** Pull entire latest updates from https://github.com/mollybeach/pearpay

**Assistant did:**
- `git fetch origin`
- Resolved merge conflicts on integration branches
- Synced local with `origin/main`

---

### Query 44 — Push All My Code

**User asked:** Push all my code.

**Assistant did:**
- Pushed integration branches
- Did NOT push `.env` or secrets
- Opened/updated PRs

---

### Query 45 — Resolve Conflicts and Push

**User asked:** Resolve conflicts and push latest updates.

**Assistant did:**
- Merged `origin/main` into feature branches
- Resolved conflicts in `Providers.tsx`, `package.json`, orchestrator tests
- Force-synced after remote main was updated
- Stashed local WIP before sync: `stash@{0}: local wip before sync from origin/main`

---

### Query 46 — Verify Flow End-to-End

**User asked:** Help verify Flow end-to-end.

**Assistant did:**
- Created `scripts/verify-flow.mjs` (later in stash, added officially in Phase P0)
- Tested API chain: status → start → source → quote
- **Result:** Steps 1–3 pass; quote fails with `USDC@EVM-5042002: unknown` (Dynamic dashboard config)

---

### Query 47 — ChunkLoadError / window is not defined

**User reported:**
```
ChunkLoadError: Loading chunk app/layout failed
ReferenceError: window is not defined
```

**Assistant diagnosed:**
- Dynamic SDK accesses `window` during SSR in `Providers.tsx`
- Fix: client mount gate with `useState` + `useEffect`
- Also: clear `.next` cache and restart dev server

**Fix applied in Phase P0 (PR #28).**

---

### Query 48–51 — Subagent Task Completions

System acknowledgment messages — Flow verification attempts continued.

---

### Query 52 — Why Dynamic Not Working?

**User asked:** Why is Dynamic not working; what's lacking; how to fix; what to ask Dynamic team at booth.

**Assistant answered:**
1. Dashboard must enable Fireblocks Flow + Arc Testnet USDC settlement
2. Payer wallet needs funds on Base/Ethereum (not Arc)
3. `DYNAMIC_API_TOKEN` must have checkout permissions
4. SSR crash prevents widget from loading (fixed in P0)
5. `chainName` bug in Flow client (fixed in P0)
6. Script to say at Dynamic booth: *"Need USDC settlement on Arc Testnet chain 5042002 for environment 97d417fe-632b-4de8-8e2d-9fd56ec98949"*

---

### Query 53 — Subagent Acknowledgment

System message.

---

### Query 54 — Does Flow Work with Testnet?

**User asked:** Does Flow not work with testnet?

**Assistant answered:** Yes — Arc Testnet `5042002` is supported. Blocker is Dynamic dashboard token config, not testnet itself.

---

### Query 55 — Dynamic Team Said Flow Enabled + Use MCP

**User said:** Dynamic team confirmed Flow is enabled; use MCP for setup.

**Assistant did:** Used Dynamic docs MCP to verify API paths; re-ran verify flow; quote still failed until dashboard Arc USDC settlement enabled.

---

### Query 56 — Fetch Latest from GitHub Again

**User asked:** Fetch latest from https://github.com/mollybeach/pearpay

**Assistant did:**
- `git fetch origin && git pull origin main`
- Local main synced to `289151f`

---

### Query 57 — npm ENOENT in Wrong Directory

**User ran `npm run dev` from parent `pearpay/` and got:**
```
ENOENT: no such file or directory, open '/Users/priyansh/Desktop/pearpay/package.json'
```

**Assistant answered:** Must run from `pearpay-molly/`:
```bash
cd /Users/priyansh/Desktop/pearpay/pearpay-molly && npm run dev
```

---

### Query 58 — Subagent Acknowledgment

System message.

---

### Query 59 — Grand Blueprint Gap Analysis

**User asked:** What is left and not working from the full ZK agentic blueprint?

**Assistant answered (~68% built, ~45% live):**

| Built | Not built / not live |
|-------|---------------------|
| NLP parser, orchestrator, escrow | Delegated access / BurnerWallet |
| Dynamic Flow 8-step API | Live cross-chain Flow payment (dashboard blocker) |
| Agent x402 routes | `DYNAMIC_WALLET_PASSWORD` not set |
| Unlink SDK integration (code) | Unlink env vars not set → stub mode |
| Arc escrow contract + verify script | Circle Gateway EIP-3009 (custom x402 EIP-191 instead) |
| WebAuthn/FaceID routes | Prod FaceID on iPhone not tested |
| 6-channel simulators | Unified single pipeline from blueprint |
| OG unfurl pay links | Production deploy env incomplete |

---

### Query 60 — Progress Percentage

**User asked:** How much finished; want fully functional app missing nothing.

**Assistant answered:** ~68% code complete, ~45% live-demo ready; listed remaining phases 0–7 for prize eligibility.

---

### Query 61 — Prize-Winning Execution Plan

**User asked:** Build plan to make all integrations work and win all prizes.

**Assistant created:** Phases 0–7 execution plan covering stabilize → credentials → Arc live → Flow live → agent x402 → Unlink live → Vercel deploy → video/submission.

---

### Query 62 & 63 — Two-Person Work Division

**User asked:** Divide phases between Priyansh (Cursor Composer 2.5) and Molly (Claude Code) without git clashes.

**Assistant created:**
- Folder ownership map
- Branch naming convention (`feat/priyan/*`, `feat/molly/*`)
- Merge order (P0 first, then parallel tracks)
- Daily sync ritual
- Credential split by sponsor
- Video segment split

---

### Query 64 — Super Detailed Individual Task Lists

**User asked:** Super detailed individual task phases for me and her.

**Assistant created:**
- **Priyansh:** Phases P0–P7 (Dynamic/Flow/Agent/Deploy)
- **Molly:** Phases M0–M7 (Arc/Unlink/Orchestrator/Submission)
- Line-by-line file lists, curl commands, acceptance criteria per phase

---

### Query 65 — Execute Phase P0 Stabilization

**User asked:** Execute P0.1 through P0.5:
- P0.1: Sync + stash recovery
- P0.2: SSR mount gate in Providers.tsx
- P0.3: Fix `chainName` in flow/client.ts
- P0.4: Create `verify:flow` script
- P0.5: Run typecheck, test, build, verify:dynamic

**Assistant did (Agent mode):**
- Branch: `feat/priyan/phase0-stabilize`
- Applied all fixes
- Created `scripts/verify-flow.mjs`
- Validation results:
  - `npm run typecheck` ✅
  - `npm test` ✅ (70 passed)
  - `npm run build` ✅
  - `npm run verify:dynamic` ✅
  - `npm run verify:flow` ⚠️ steps 1–3 pass; quote fails (dashboard)
- Commit: `634ae63 fix: SSR Providers + Flow chainName + verify:flow`
- **PR #28 opened and MERGED:** https://github.com/mollybeach/pearpay/pull/28

---

### Query 66 — Connect Git to My Folder

**User asked:** Connect git to my folder.

**Assistant did:**
- Discovered nested git repos (stale parent + real pearpay-molly)
- Removed stale `/Users/priyansh/Desktop/pearpay/.git` (only had "Initial commit")
- Added `.vscode/settings.json` for nested repo detection
- Confirmed pearpay-molly connected to `origin` as `priyanshshahh`

---

### Query 67 & 68 — This Document

**User asked:** Tell me everything we have done in an md file, super detailed line to line.

**Assistant created:** This file — `docs/PROJECT_HISTORY.md`

---

## 5. PearPay Product Vision (Original Blueprint)

The original master blueprint (Query 1) described PearPay as:

> *"The Apple Pay of the Agentic Economy"*

### Intended user flow (grand vision)

1. User types intent in iMessage/WhatsApp/Telegram: *"Pay the security agent $45"*
2. NLP engine **proposes** payment (never holds keys)
3. Base64 payment URL unfurls as Apple Pay-style OG card in chat
4. User taps → **WebAuthn/FaceID** fires (human consent boundary)
5. **Dynamic Flow** routes from any chain/token → settles USDC on Arc
6. Optional **"privately"** keyword → **Unlink SDK** shields amount/counterparty
7. **Agent path:** Dynamic server wallet autonomously pays x402-gated APIs
8. **Arc x402 GatewayClient** batches gasless nanopayments (Circle EIP-3009 vision)

### What was actually built vs blueprint

| Blueprint component | Status |
|---------------------|--------|
| NLP intent parser | ✅ Built (`src/core/nlp/parser.ts`) |
| Recipient resolver (phone, handle, address) | ✅ Built |
| Claimable escrow | ✅ Built (on-chain + in-memory stub) |
| OG unfurl pay links | ✅ Built (`/pay/[data]/opengraph-image.tsx`) |
| WebAuthn/FaceID | ✅ Built (needs prod iPhone test) |
| Dynamic embedded wallets | ✅ Wired |
| Dynamic Flow 8-step | ✅ Wired (quote blocked on dashboard) |
| Dynamic server wallet + x402 | ✅ Wired (needs `DYNAMIC_WALLET_PASSWORD`) |
| Unlink private rail | ✅ Wired (needs Unlink env vars) |
| Arc escrow smart contract | ✅ Built + tested (Foundry) |
| Circle Gateway EIP-3009 | ❌ Not built (custom EIP-191 x402 instead) |
| BurnerWallet / delegated access | ❌ Not built |
| Single unified ZK pipeline | ❌ Partial (separate rails, not one pipeline) |
| iOS native iMessage extension | ⚠️ Thin layer exists (`ios/`) |
| 6-channel simulators | ✅ Built (`/messages`) |

---

## 6. Codebase Evolution — Molly's App (pearpay-molly)

Molly built the canonical app using LingCode. Git history (oldest → newest on `main`):

| Commit | Description |
|--------|-------------|
| `b4021c5` | Comprehensive README |
| `fd853e1` | TypeScript + Next.js scaffold |
| `84d55d9` | NLP payment intent parser |
| `41bcd4d` | Universal recipient resolution |
| `02c5ba4` | Smart claimable escrow service |
| `7a70d0e` | Payment orchestrator + rail selection |
| `c990d98` | Sponsor SDK adapter stubs |
| `4bd2dd1` | Multi-channel adapters (6 messaging apps) |
| `a082225` | Next.js frontend + API + claim flow |
| `52e4d6b` | `PearPayEscrow.sol` (Arc + Hedera, later Hedera removed) |
| `cb2f497` | Deterministic NLP parser |
| `a19f6e1` | Thin native iMessage / Apple Pay iOS layer |
| `333116c` | Core unit tests (money, parser, escrow) |
| `0f675d0` | Tailwind redesign |
| `a827bea` | Header, Footer, About page |
| `984aa7b` | Flow, FaceID, pay links, agent payments (PR #1) |
| `6007e0f` | Arc liquidity hub + escrow tooling (PR #16) |
| `168e851` | ChannelPlayground — Telegram, Discord simulators |
| `de19d23` | Slack, WhatsApp, X simulators |
| `672c2da` | On-chain Arc escrow wiring + verify scripts |
| `1aef087` | Drop Hedera/ENS; default settlement to Arc |
| `e69c5a9` | **PR #27:** Dynamic live Flow + wagmi + agent x402 |
| `3123389` | **PR #26:** Arc escrow live integration |
| `a5ed1db` | Unlink live integration + docs |
| `b022197` | Switch demo from Base Sepolia to Arc Testnet |
| `2095aac` | Published `@unlink-xyz/sdk` canary |
| `289151f` | Move USDC/EURC address docs into `docs/` |
| `634ae63` | **PR #28:** SSR fix + chainName + verify:flow |

### Major features in Molly's app

- **`/messages`** — 6 messaging app simulators with conversational pay UX
- **`/pay`** — Real on-chain USDC demo
- **`/pay/[data]`** — Shareable pay links with OG unfurl
- **`/prizes`** — Bounty evidence tabs (Arc, Dynamic, Unlink)
- **`/claim/[token]`** — Claimable payment flow
- **`/`** — Homepage with AgentDemo
- **`contracts/PearPayEscrow.sol`** — Foundry-tested escrow
- **`npm run judge:demo`** — Runs all three sponsor verify scripts

---

## 7. Codebase Evolution — Priyansh's Cursor Build (parent pearpay/)

Priyansh's Cursor-built code lives **outside** `pearpay-molly/` and is **legacy reference only**:

```
pearpay/
├── web/                    ← Next.js app (Cursor scaffold)
│   ├── src/app/            ← pay page, API routes
│   ├── src/components/     ← PaymentFlow, Providers, WebAuthn
│   └── src/hooks/          ← useFlowPayment, useWebAuthn, usePayment
├── engine/                 ← FastAPI backend
│   └── app/                ← parser, webhooks, x402 stubs
├── scripts/                ← Root-level scripts
├── README.md
├── PHASES.md
├── DYNAMIC_BOUNTY.md
└── AI_ATTRIBUTION.md
```

### What was ported from Cursor build → Molly's app

| Cursor (`web/`) feature | Ported to pearpay-molly |
|---------------------------|-------------------------|
| Dynamic `Providers.tsx` + wagmi | ✅ `src/components/Providers.tsx` |
| `useFlowPayment.ts` full hook | ✅ `src/hooks/useFlowPayment.ts` |
| Flow 8-step API client | ✅ `src/integrations/flow/client.ts` |
| WebAuthn server + hook | ✅ `src/integrations/webauthn/`, `src/hooks/useWebAuthn.ts` |
| Agent x402 demo | ✅ `src/components/AgentDemo.tsx`, `app/api/agent/*` |
| Dynamic server wallet | ✅ `src/integrations/dynamic/server-wallet.ts` |
| x402 signing | ✅ `src/lib/x402.ts` |
| PaymentFlow UI polish | ✅ `src/components/PaymentFlow.tsx` |

### What was NOT ported (Molly already had better versions)

- NLP parser / orchestrator (Molly's is more complete)
- Arc integration (Molly built from scratch)
- Unlink integration (Molly built from scratch)
- 6-channel simulators (Molly built)
- Foundry contracts (Molly built)
- FastAPI engine (not needed — Next.js API routes used instead)

---

## 8. Merge Story: Two Apps → One App

### Timeline

| When | Event |
|------|-------|
| Fri Jun 12, ~9 PM | Priyansh and Molly confirm two parallel apps |
| Fri Jun 12, ~9:42 PM | Decision: merge into Molly's GitHub repo |
| Fri Jun 12, ~9:59 PM | Merge plan executed — integration branch created |
| Fri Jun 12, late | PR opened for Cursor → Molly merge |
| Sat Jun 13, 12:36 PM | Confirm working only on `pearpay-molly` |
| Sat Jun 13, afternoon | Arc escrow PR #26 merged |
| Sat Jun 13, evening | Dynamic live PR #27 merged |
| Sat Jun 13, night | Git sync, conflict resolution, stash WIP |
| Sat Jun 14, ~12:21 AM | Phase P0 PR #28 merged |

### Merge principles followed

1. Molly's repo (`pearpay-molly`) = canonical base
2. Additive integration — don't remove Molly's features
3. Replace only where Priyansh's implementation was strictly better (Flow client, wagmi connector, x402 signing)
4. No "merged app" branding — one PearPay app
5. Never commit `.env` or secrets

### Stash preserved

```
stash@{0}: On integration/dynamic-live: local wip before sync from origin/main
  - Providers.tsx SSR fix
  - flow/client.ts chainName fix
  - verify-flow script
  - DYNAMIC SETUP.MD (Dynamic ETHGlobal docs dump)
```

Contents applied officially in PR #28; stash can be dropped after confirming.

---

## 9. Pull Request History

| PR | Title | Branch | Status | Date |
|----|-------|--------|--------|------|
| #1 | Add Flow, FaceID pay links, and agent payments | `integration/flow-faceid-agent` | MERGED | Jun 13 |
| #16 | Arc liquidity hub, escrow tooling, issue fixes | `fix/open-github-issues` | MERGED | Jun 13 |
| #23 | Enhance payment UI + multi-channel simulators | `feat/payment-card-ui` | MERGED | Jun 13 |
| #24 | Update docs for npm usage | `feat/payment-card-ui` | MERGED | Jun 13 |
| #25 | RealPayment component + messages page | `feat/payment-card-ui` | MERGED | Jun 13 |
| #26 | Arc on-chain escrow wiring + live verify | `integration/arc-escrow-live-latest` | MERGED | Jun 13 |
| #27 | Dynamic server wallet SDK + x402 + Flow live | `integration/dynamic-live` | MERGED | Jun 13 |
| **#28** | **SSR Providers + Flow chainName + verify:flow** | **`feat/priyan/phase0-stabilize`** | **MERGED** | **Jun 14** |

---

## 10. Integration Status Matrix

| Integration | Code wired | Env configured | Live tested | Verify script |
|-------------|-----------|----------------|-------------|---------------|
| NLP parser | ✅ | N/A | ✅ | `npm test` |
| Orchestrator | ✅ | N/A | ✅ stub | `npm test` |
| Arc escrow contract | ✅ | ⚠️ partial | ⚠️ partial | `npm run verify:arc` |
| Arc USDC settlement | ✅ | ⚠️ needs funder | ⚠️ | `npm run verify:arc` |
| Dynamic embedded wallet | ✅ | ✅ env ID set | ⚠️ SSR was broken → fixed P0 | `npm run verify:dynamic` |
| Dynamic Flow 8-step | ✅ | ✅ API token set | ❌ quote fails | `npm run verify:flow` |
| Dynamic server wallet | ✅ | ❌ no password | ❌ | `npm run verify:dynamic` |
| Agent x402 | ✅ | ❌ no password | ❌ | manual demo |
| Unlink private rail | ✅ | ❌ no keys | ❌ stub | `npm run verify:unlink` |
| WebAuthn/FaceID | ✅ | ⚠️ localhost | ❌ prod untested | manual |
| Twilio claim SMS | ✅ | ⚠️ partial | ❌ | manual |
| OG unfurl | ✅ | ⚠️ needs prod URL | ❌ iMessage untested | manual |
| 6-channel simulators | ✅ | N/A | ✅ | `/messages` |
| Vercel production | ⚠️ | ⚠️ incomplete | ⚠️ pearpay.app exists | `BASE_URL=https://pearpay.app npm run judge:demo` |

---

## 11. Environment Variables — What Is Set vs Missing

Local `.env` in `pearpay-molly/.env` (never committed). Status as of end of chat:

### Dynamic (Priyansh owns)

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` | ✅ `97d417fe-632b-4de8-8e2d-9fd56ec98949` |
| `DYNAMIC_ENV_ID` | ✅ same |
| `DYNAMIC_API_TOKEN` | ✅ set (`dyn_...`) |
| `DYNAMIC_WALLET_PASSWORD` | ❌ empty — blocks agent x402 |
| `DYNAMIC_FLOW_CHECKOUT_ID` | ❌ empty (auto-created if unset) |
| `DYNAMIC_FLOW_WEBHOOK_SECRET` | ❌ empty (optional) |
| `AGENT_WALLET_ADDRESS` | ✅ `0xB214...4763` |

### Arc / Circle (Molly owns)

| Variable | Status |
|----------|--------|
| `FUNDER_PRIVATE_KEY` / `PRIVATE_KEY` | ✅ set |
| `CIRCLE_API_KEY` | ✅ set |
| `ARC_RPC_URL` | ✅ `https://rpc.testnet.arc.network` |
| `ARC_USDC_ADDRESS` | ✅ `0x3600000000000000000000000000000000000000` |
| `ARC_ESCROW_CONTRACT_ADDRESS` | ✅ `0x065484A8...` |
| `NEXT_PUBLIC_ARC_CHAIN_ID` | ✅ `5042002` |
| `ESCROW_DATABASE_URL` | ❌ empty — prod persistence |

### Unlink (Molly owns)

| Variable | Status |
|----------|--------|
| `UNLINK_API_KEY` | ❌ empty |
| `UNLINK_ENGINE_URL` | ❌ empty (should be `https://arc-testnet-production-api.unlink.xyz`) |
| `UNLINK_ACCOUNT_MNEMONIC` | ❌ empty (use `cast wallet new-mnemonic`) |
| `UNLINK_ENVIRONMENT` | default `arc-testnet` |

### WebAuthn (Priyansh owns for prod)

| Variable | Local | Production needed |
|----------|-------|-------------------|
| `WEBAUTHN_RP_ID` | `localhost` | `pearpay.app` |
| `WEBAUTHN_ORIGIN` | `http://localhost:3000` | `https://pearpay.app` |

### Twilio (optional)

| Variable | Status |
|----------|--------|
| `TWILIO_ACCOUNT_SID` | ✅ set |
| `TWILIO_AUTH_TOKEN` | ✅ set |
| Other `TWILIO_*` | ⚠️ partial |

---

## 12. Known Bugs, Fixes, and Blockers

### Fixed in PR #28 (Phase P0)

| Bug | Cause | Fix |
|-----|-------|-----|
| `ChunkLoadError: app/layout.js` | Stale `.next` cache after code changes | `rm -rf .next && npm run dev` |
| `window is not defined` | Dynamic SDK runs during SSR | Mount gate in `Providers.tsx` |
| Flow quote schema error | `chain: "EVM"` instead of `chainName` | Fixed in `flow/client.ts:149` |
| No Flow smoke test | Script missing | Added `scripts/verify-flow.mjs` |

### Still open blockers

| Blocker | Owner | Fix |
|---------|-------|-----|
| Flow quote: `USDC@EVM-5042002: unknown` | Priyansh + Dynamic team | Enable Arc Testnet USDC in Dynamic dashboard |
| Agent demo not live | Priyansh | Set `DYNAMIC_WALLET_PASSWORD` |
| Unlink stub mode | Molly | Set Unlink env vars from dashboard.unlink.xyz |
| FaceID on prod iPhone | Priyansh | Set WebAuthn prod env + HTTPS test |
| npm from wrong directory | Both | Always `cd pearpay-molly` |
| Dev server port conflict | Both | Kill old process on 3000 before restart |

---

## 13. Phase P0 Stabilization (Latest Work)

**Branch:** `feat/priyan/phase0-stabilize`  
**PR:** #28 (MERGED)  
**Commit:** `634ae63`

### Files changed

```
src/components/Providers.tsx     ← SSR mount gate
src/integrations/flow/client.ts  ← chainName fix
scripts/verify-flow.mjs          ← new smoke test
package.json                     ← "verify:flow" script
```

### Providers.tsx fix (P0.2)

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <div className="min-h-screen bg-ambient" aria-busy="true" />;
// Only then render DynamicContextProvider
```

### flow/client.ts fix (P0.3)

```tsx
// Before (broken):
{ address: params.recipient, chain: "EVM", chainId: ARC_CHAIN_ID }

// After (fixed):
{ address: params.recipient, chainName: "EVM", chainId: ARC_CHAIN_ID }
```

### verify:flow script (P0.4)

Steps executed:
1. `GET /api/flow/status` → must return `configured: true`
2. `POST /api/flow/payment/start` → creates transaction
3. `POST /api/flow/payment/source` → attaches Base chain source
4. `POST /api/flow/payment/quote` → must not return `unknown`

Run: `npm run verify:flow` (requires `npm run dev` in another terminal)

### P0.5 validation results

```
npm run typecheck        ✅
npm test                 ✅ 70 passed, 2 skipped
npm run build            ✅ (warnings only)
npm run verify:dynamic   ✅ (⚠️ DYNAMIC_WALLET_PASSWORD missing)
npm run verify:flow      ⚠️ steps 1–3 ✅, quote ❌ (dashboard)
```

---

## 14. Two-Person Work Division Plan

Created in chat (Queries 62–64). Summary:

### Priyansh — Dynamic track

| Phase | Task | Branch |
|-------|------|--------|
| P0 | Stabilize SSR + chainName + verify:flow | `feat/priyan/phase0-stabilize` ✅ MERGED |
| P1 | Dynamic dashboard credentials | — |
| P2 | Flow live E2E browser demo | `feat/priyan/flow-live` |
| P3 | WebAuthn prod on iPhone | `feat/priyan/webauthn-prod` |
| P4 | Agent x402 live | `feat/priyan/agent-x402` |
| P5 | Vercel deploy + prod env | `feat/priyan/deploy-vercel` |
| P6 | Dynamic prize tab evidence | `feat/priyan/prizes-dynamic` |
| P7 | Video: Flow + Agent segments | — |

**Do NOT touch:** `src/integrations/arc/`, `src/integrations/unlink/`, `settlement.ts`, `orchestrator.ts`

### Molly — Arc + Unlink track

| Phase | Task | Branch |
|-------|------|--------|
| M0 | Sync from main after P0 merge | — |
| M1 | Arc + Unlink credentials | — |
| M2 | Arc live escrow + claim | `feat/molly/arc-live` |
| M3 | Unlink live private send | `feat/molly/unlink-live` |
| M4 | Orchestrator polish + /prizes tabs | `feat/molly/orchestrator-polish` |
| M5 | Production verify | `feat/molly/prod-fixes` |
| M6 | ETHGlobal submission copy | `feat/molly/submission-docs` |
| M7 | Video: Unlink + Arc segments | — |

**Do NOT touch:** `Providers.tsx`, `flow/`, `dynamic/`, `useFlowPayment.ts`, agent routes

### Merge order

```
1. feat/priyan/phase0-stabilize → main  ✅ DONE
2. Parallel: flow-live + arc-live + unlink-live → main
3. feat/priyan/agent-x402 → main
4. feat/priyan/deploy-vercel → main
5. npm run judge:demo on production
```

---

## 15. Git Setup Fix (Nested Repos)

**Problem:** Cursor workspace = `/Users/priyansh/Desktop/pearpay` but git repo = `pearpay-molly/.git`

**Fix applied (Query 66):**
1. Removed stale parent `.git` (only had unrelated Initial commit)
2. Added `/Users/priyansh/Desktop/pearpay/.vscode/settings.json`:
   ```json
   {
     "git.autoRepositoryDetection": true,
     "git.repositoryScanMaxDepth": 2,
     "git.openRepositoryInParentFolders": "always"
   }
   ```
3. Confirmed GitHub auth: `priyanshshahh` logged in via `gh`

**Correct git commands:**
```bash
cd /Users/priyansh/Desktop/pearpay/pearpay-molly
git fetch origin
git pull origin main
git push
```

---

## 16. File & Directory Map (Current App)

```
pearpay-molly/
├── app/
│   ├── page.tsx                          ← Homepage + AgentDemo
│   ├── layout.tsx                        ← Root layout + Providers
│   ├── messages/page.tsx                 ← 6-channel simulator playground
│   ├── pay/
│   │   ├── page.tsx                      ← Real USDC payment demo
│   │   └── [data]/
│   │       ├── page.tsx                  ← Shareable pay link
│   │       └── opengraph-image.tsx       ← OG unfurl card (1200×630)
│   ├── prizes/page.tsx                   ← Bounty evidence tabs
│   ├── claim/[token]/page.tsx            ← Claimable payment UI
│   └── api/
│       ├── payments/route.ts             ← NLP → orchestrator → payUrl
│       ├── flow/payment/                 ← Flow 8-step routes
│       ├── flow/status/route.ts
│       ├── agent/                        ← Agent initialize, run-intent, actions
│       ├── x402/                         ← 402-gated premium data API
│       ├── privacy/shield/route.ts       ← Unlink shield endpoint
│       ├── webauthn/                     ← FaceID register/authenticate
│       ├── webhooks/flow/route.ts        ← HMAC Flow webhooks
│       └── claim/[token]/route.ts
├── src/
│   ├── components/
│   │   ├── Providers.tsx                 ← Dynamic + wagmi (SSR gated)
│   │   ├── PaymentFlow.tsx               ← FaceID + Flow pay UI
│   │   ├── DynamicWalletButton.tsx
│   │   └── AgentDemo.tsx
│   ├── hooks/
│   │   ├── useFlowPayment.ts
│   │   ├── useWebAuthn.ts
│   │   └── usePayment.ts
│   ├── integrations/
│   │   ├── dynamic/                      ← Server wallet SDK
│   │   ├── flow/client.ts                ← Flow 8-step client
│   │   ├── arc/                          ← Arc settlement + escrow
│   │   ├── unlink/index.ts               ← Unlink SDK wrapper
│   │   └── webauthn/
│   ├── core/
│   │   ├── nlp/parser.ts                 ← "privately" keyword detection
│   │   ├── payments/orchestrator.ts
│   │   ├── payments/settlement.ts        ← arc vs unlink rail selection
│   │   └── escrow/
│   └── lib/
│       ├── env.ts                        ← Centralized zod env schema
│       ├── x402.ts                       ← EIP-191 x402 signing
│       └── wagmi.ts
├── contracts/PearPayEscrow.sol
├── scripts/
│   ├── verify-dynamic.mjs
│   ├── verify-flow.mjs                   ← NEW in PR #28
│   ├── verify-arc → arc-live-verify.mjs
│   ├── verify-unlink.mjs
│   └── judge-demo.mjs
├── tests/                                ← 70 passing tests
└── docs/
    ├── JUDGING.md
    ├── ARC_BOUNTY.md
    ├── DYNAMIC_BOUNTY.md
    ├── UNLINK_BOUNTY.md
    ├── DYNAMIC_SETUP.md
    ├── ENV_SETUP.md
    ├── PHASES.md
    ├── Submission.md
    └── PROJECT_HISTORY.md                ← THIS FILE
```

---

## 17. Verification Scripts & Commands

All commands run from `pearpay-molly/`:

```bash
# Development
npm install
npm run dev                    # → http://localhost:3000

# Quality gates
npm run typecheck
npm test
npm run build
npm run lint

# Sponsor verification
npm run verify:dynamic         # Dynamic env + unit tests
npm run verify:flow            # Flow API smoke test (needs dev server)
npm run verify:arc             # Arc escrow + claim on testnet
npm run verify:unlink          # Unlink SDK registration + API

# All prizes at once
npm run judge:demo
BASE_URL=https://pearpay.app npm run judge:demo   # production

# Contracts
npm run test:contracts         # forge test
npm run deploy:escrow          # deploy PearPayEscrow.sol
```

### Manual demo curl commands

```bash
# Create payment intent
curl -s -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"message":"Send molly.eth $5 for coffee","channel":"web"}' | jq .

# Flow status
curl http://localhost:3000/api/flow/status

# Agent status
curl http://localhost:3000/api/agent/status

# Unlink shield (needs env)
curl -s -X POST http://localhost:3000/api/privacy/shield \
  -H "Content-Type: application/json" \
  -d '{"amount":"1.00","recipient":"0x..."}' | jq .
```

---

## 18. What Is Left Before Judging

### Critical path (must do)

- [ ] **Priyansh P1:** Dynamic dashboard — enable Arc Testnet USDC settlement (5042002)
- [ ] **Priyansh P2:** Complete one real Flow payment in browser → ArcScan proof
- [ ] **Priyansh P4:** Set `DYNAMIC_WALLET_PASSWORD` → live agent x402 demo
- [ ] **Molly M1:** Unlink dashboard keys + mnemonic
- [ ] **Molly M3:** `npm run verify:unlink` green + private send in `/messages`
- [ ] **Molly M2:** `npm run verify:arc` green + ArcScan escrow/claim URLs
- [ ] **Priyansh P5:** Vercel prod env (all sponsor vars) + hard refresh pearpay.app
- [ ] **Both P7/M7:** Record and stitch 2–4 min demo video
- [ ] **Molly M6:** Submit ETHGlobal form (`docs/Submission.md`)

### Nice to have

- [ ] OG unfurl test in iMessage on iPhone
- [ ] FaceID on physical iPhone via Safari + HTTPS
- [ ] Flow webhook registered on production URL
- [ ] Twilio live claim SMS
- [ ] `ESCROW_DATABASE_URL` for prod persistence

### Final gate before booth

```bash
cd pearpay-molly
npm run typecheck && npm test && npm run build
BASE_URL=https://pearpay.app npm run judge:demo
```

All three sections (Arc, Dynamic, Unlink) must exit 0.

---

## 19. Appendix: Key URLs and Docs

| Resource | URL |
|----------|-----|
| Live app | https://pearpay.app |
| GitHub repo | https://github.com/mollybeach/pearpay |
| PR #28 (P0 fix) | https://github.com/mollybeach/pearpay/pull/28 |
| GitHub issues | https://github.com/mollybeach/pearpay/issues |
| Dynamic dashboard | https://app.dynamic.xyz |
| Dynamic Flow docs | https://www.dynamic.xyz/docs/overview/fireblocks-flow |
| Dynamic MCP | https://www.dynamic.xyz/docs/mcp |
| Dynamic Flow demo | https://flow.dynamic.dev |
| Unlink dashboard | https://dashboard.unlink.xyz |
| Arc testnet explorer | https://testnet.arcscan.app |
| Circle USDC addresses | https://developers.circle.com/stablecoins/usdc-contract-addresses |
| ETHGlobal NYC 2026 | https://ethglobal.com/events/newyork2026 |
| Dynamic prizes | https://ethglobal.com/events/newyork2026/prizes/dynamic |

### Internal docs

| Doc | Purpose |
|-----|---------|
| `docs/JUDGING.md` | Judge demo script |
| `docs/PHASES.md` | Build phase checklist |
| `docs/ENV_SETUP.md` | How to obtain every env var |
| `docs/DYNAMIC_SETUP.md` | Dynamic dashboard checklist |
| `docs/ARC_BOUNTY.md` | Arc prize narrative + demo script |
| `docs/DYNAMIC_BOUNTY.md` | Dynamic prize narrative + demo script |
| `docs/UNLINK_BOUNTY.md` | Unlink prize narrative + demo script |
| `docs/Submission.md` | ETHGlobal form answers |
| `docs/PROJECT_HISTORY.md` | This file |

---

*End of document. Last updated after PR #28 merge and git folder connection fix.*
