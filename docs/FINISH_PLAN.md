# PearPay — Finish-the-Blueprint Plan

Goal: close the gap between what exists today (~60% product, ~35% of the
blueprint's specific crypto architecture) and the full ZK/agentic blueprint.

Each phase below has: **Goal · Why · Files · SDK/calls · Acceptance test · Done-when**.
Phases are ordered by the **critical path** — earlier phases unblock later ones.
Owner tags: **[P]** Priyansh (Dynamic/Flow/agent/deploy), **[M]** Molly (Arc/Unlink/contracts).

Legend: 🟢 mostly done · 🟡 partial · 🔴 missing

---

## Phase 0 — Stabilize & Credentials (foundation) 🟡
**Goal:** green build + every sponsor dashboard key in `.env`. Nothing below works live without this.

- **0.1 [P+M]** Confirm gates pass: `npm run typecheck && npm test && npm run build`.
- **0.2 [P]** Dynamic dashboard: enable Fireblocks Flow, add **Arc Testnet 5042002** as a settlement chain, enable **USDC settlement on Arc**, add Base/Ethereum as source chains. This is the fix for the `USDC@EVM-5042002: unknown` quote error.
- **0.3 [P]** Set `DYNAMIC_WALLET_PASSWORD`, `DYNAMIC_FLOW_CHECKOUT_ID`, `DYNAMIC_FLOW_WEBHOOK_SECRET`.
- **0.4 [M]** Unlink dashboard: `UNLINK_API_KEY`, `UNLINK_ENGINE_URL=https://arc-testnet-production-api.unlink.xyz`, `UNLINK_ACCOUNT_MNEMONIC` (`cast wallet new-mnemonic`).
- **0.5 [M]** Arc/Circle: `CIRCLE_API_KEY`, `FUNDER_PRIVATE_KEY` funded from Arc faucet, deploy escrow → `ARC_ESCROW_CONTRACT_ADDRESS`.

**Acceptance:** `npm run verify:dynamic`, `verify:arc`, `verify:unlink` each print "configured: true" for their env section.
**Done-when:** `npm run judge:demo` runs all three sections without an env-missing error.

---

## Phase 1 — Flow live (liquidity abstraction) 🟡→🟢  · Blueprint §6.1
**Goal:** one real cross-chain payment: source token on Base → settle USDC on Arc, with an ArcScan tx hash.

- **Files:** `src/integrations/flow/client.ts`, `src/hooks/useFlowPayment.ts`, `src/lib/flow.ts`, `app/api/flow/payment/*`.
- **Work:**
  1. Verify the 8-step chain end-to-end now that dashboard (0.2) is fixed: `npm run verify:flow` must pass **step 4 (quote)**.
  2. In `PaymentFlow.tsx` complete the browser flow: connect Dynamic wallet → `flowStart → flowAttachSource → flowQuote → flowPrepare → signAndBroadcastEvm → flowBroadcast → poll`.
  3. Register the Flow webhook (`/api/webhooks/flow`) on the public URL; confirm `settlement.state.completed` lands in `.flow-webhook-log.json`.
- **Acceptance:** `verify:flow` exits 0; a browser payment shows a real Arc settlement tx on `testnet.arcscan.app`.
- **Done-when:** screen-recordable Flow payment from Base USDC → Arc USDC.

---

## Phase 2 — Real Circle Gateway x402 nanopayments 🔴→🟢 · Blueprint §8
**Goal:** replace the custom EIP-191 x402 (`PearPay:x402:url:amount`) with the **real Circle Gateway batched standard** (EIP-3009 `TransferWithAuthorization` against `GatewayWallet`).

- **Add SDK:** `@circle-fin/x402-batching` (client + server).
- **Files to rewrite:**
  - `src/lib/x402.ts` → use `buildPaymentRequirements(price)`, atomic amount `× 1e6`, `accepts` array targeting `eip155:5042002` + `GatewayWalletBatched`.
  - `app/api/x402/premium/data/route.ts` → wrap with `withGateway` server middleware; emit HTTP **402** + `PAYMENT-REQUIRED` (base64) when unpaid.
  - New: agent buyer uses `GatewayClient` to sign **EIP-3009** off-chain, send `payment-signature` header.
  - Server: `BatchFacilitatorClient.verify()` then `.settle()`; return `PAYMENT-RESPONSE` header with txHash.
- **Acceptance:** `tests/x402.test.ts` updated to assert EIP-3009 payload shape; a mock agent (`npm run agent`) hits `/api/x402/premium/data`, gets 402, pays, receives data + on-chain batched tx hash.
- **Done-when:** agent pays sub-cent USDC gas-free with a verifiable Arc tx. *(Targets Arc "Best Agentic Economy".)*

---

## Phase 3 — Dynamic Delegated Access & Server Wallet signing 🔴→🟢 · Blueprint §6.2
**Goal:** FaceID once → backend agent autonomously signs subsequent Unlink/Arc payloads on the user's behalf.

- **Files:** `src/components/PaymentFlow.tsx` (frontend delegation), `src/integrations/dynamic/server-wallet.ts`, new `app/api/webhooks/dynamic/route.ts`.
- **Work:**
  1. Frontend: after WebAuthn success, call `delegateWaasKeyShares({ walletAccount })` (Dynamic React SDK).
  2. Backend webhook: receive `delegation.created`, store encrypted key share.
  3. Server: `createDelegatedEvmWalletClient({ environmentId, apiKey })` → `delegatedSignMessage(client, { walletId, walletApiKey, keyShare, message })`.
  4. Replace agent's self-owned EIP-191 signing with **delegated** signing of the x402 payload (feeds Phase 2).
- **Acceptance:** new test asserts a delegated signature verifies to the *user's* wallet, not the agent's; agent completes an x402 pay without a second FaceID prompt.
- **Done-when:** one biometric prompt authorizes a full multi-step settlement. *(Targets Dynamic "Best Agentic Build".)*

---

## Phase 4 — Unlink live + Ephemeral Burner Wallet 🔴→🟢 · Blueprint §7
**Goal:** real ZK shielding using the **burner-wallet lifecycle** (currently absent — no `BurnerWallet/fundFromPool/dispose/deleteKey`).

- **Files:** `src/integrations/unlink/index.ts`, `src/core/payments/settlement.ts`, `app/api/privacy/shield/route.ts`.
- **Work (exact sequence per §7.1):**
  1. `BurnerWallet.create(storage)`.
  2. `fundFromPool()` — ZK withdraw exact USDC to burner.
  3. Poll `burner.getStatus()` until `funded`.
  4. Poll on-chain `USDC.balanceOf(burner.address)` (guards RPC lag).
  5. `approve(GatewayWallet, amount)` with **4s delay + 3× retry** loop.
  6. After settlement: `burner.dispose()` then `burner.deleteKey()`.
- **Acceptance:** `verify:unlink` registers a live account and routes USDC A→B through the pool on Arc testnet; `tests/unlink-live.test.ts` un-skipped and green; burner address has zero residual balance after dispose.
- **Done-when:** private send in `/messages` produces an opaque note + sanitized burner. *(Targets Unlink prizes + joint Private Nanopayments.)*

---

## Phase 5 — TSS-MPC ↔ FaceID binding 🟡→🟢 · Blueprint §5.2
**Goal:** make FaceID actually gate the Dynamic MPC key-share (today it's a separate gate, not bound to signing).

- **Files:** `src/hooks/useWebAuthn.ts`, `src/components/PaymentFlow.tsx`, `src/integrations/webauthn/server.ts`.
- **Work:** require a verified WebAuthn assertion before the embedded-wallet local key share decrypts / before delegation (Phase 3) fires. Fail closed if assertion missing.
- **Acceptance:** signing is impossible without a fresh WebAuthn assertion (test forces the negative path).
- **Done-when:** demo shows FaceID → and only then → on-chain action.

---

## Phase 6 — Production deploy 🟡→🟢 · Blueprint §2.1 / §10
**Goal:** `pearpay.app` runs all live paths.

- **Files:** Vercel env, `src/lib/env.ts` (`getProductionReadiness`), `next.config.mjs`.
- **Work:** set all sponsor secrets in Vercel; set `WEBAUTHN_RP_ID=pearpay.app`, `WEBAUTHN_ORIGIN=https://pearpay.app`, `APP_URL`/`NEXT_PUBLIC_*` to prod; add `ESCROW_DATABASE_URL` (durable escrow store — replace `InMemoryEscrowStore`).
- **Acceptance:** `BASE_URL=https://pearpay.app npm run judge:demo` → all three sections exit 0.
- **Done-when:** prod smoke test passes; OG card unfurls when the `/pay/[data]` link is shared.

---

## Phase 7 — Native iMessage / SFSafariViewController 🟡 · Blueprint §2.2 / §5
**Goal:** the blueprint's "ZK privacy injected into a native iOS chat" story. Today the Swift layer uses Apple Pay PassKit, not `SFSafariViewController` + WebAuthn.

- **Files:** `ios/PearPayMessages/MessagesViewController.swift`, `PaymentComposerView.swift`.
- **Work:** on send, open the `/pay/[data]` URL in an `SFSafariViewController` so WebAuthn/FaceID + Unlink run over the real web flow (not a PassKit shortcut).
- **Acceptance:** typing in the iMessage extension unfurls the OG card and opens the web pay flow over Safari with FaceID.
- **Done-when:** physical-iPhone demo of intent → unfurl → FaceID → settle. *(Targets Unlink "Major App Integration".)*
- **Note:** highest effort/lowest certainty — treat as stretch; the `/messages` web simulator already covers the demo if iOS slips.

---

## Phase 8 — ENS + asset denomination in parser 🟡 · Blueprint §3.1
**Goal:** parser resolves names via **ENS** and maps currency words to Flow token IDs (today: no `resolveName`).

- **Files:** `src/core/nlp/parser.ts`, `src/core/recipients/resolver.ts`.
- **Work:** add a resolver step `viem` `getEnsAddress` for `*.eth`; map "dollars/bucks/usdc/eurc" → token address.
- **Acceptance:** `parser.test.ts`/`orchestrator.test.ts` cover `molly.eth` → 0x and EURC selection.
- **Done-when:** "Send molly.eth $5" resolves to a real address.

---

## Phase 9 — Compliance, attribution, video 🟡 · Blueprint §2.1 / §10.4
**Goal:** submission-ready.

- **9.1 [M]** Verify `docs/AI_ATTRIBUTION.md` states cryptographic/SDK/NLP logic is human-engineered; AI used only for UI scaffolding.
- **9.2 [P+M]** Record 2–4 min, un-sped, 1080p, following §10.4 choreography: Intent → FaceID → Shielding spinner → 402/EIP-3009 settle → ArcScan receipt → burner `deleteKey`.
- **9.3 [M]** Fill `docs/Submission.md`; public repo clean.
- **Done-when:** video uploaded, ETHGlobal form submitted.

---

## Critical path (do in this order)

```
P0 (creds) ─┬─► P1 Flow live ─────────────┐
            ├─► P4 Unlink burner ──────────┤
            └─► P2 Circle x402 ─► P3 Delegated ─► P5 TSS bind ─► P6 Deploy ─► P9 Video
                                                                  ▲
                              P7 iMessage (stretch) ──────────────┘
                              P8 ENS (parallel, low-risk)
```

- **P0 blocks everything.**
- **P1, P2, P4 are independent** after P0 — parallelize across the two of you.
- **P3 depends on P2** (delegated signing feeds the x402 payload).
- **P5 depends on P3.** **P6 depends on P1–P5.** **P9 depends on P6.**

## Prize → phase mapping
| Prize | Unblocked by |
|---|---|
| Dynamic — Best Use of Flow | P1 |
| Dynamic — Best Agentic Build | P2 + P3 |
| Arc — Best Agentic Economy (x402) | P2 |
| Arc — Best Chain Abstracted | P1 |
| Arc — Best Smart Contracts | already 🟢 (escrow) + P0 deploy |
| Unlink — Major App Integration | P4 (+ P7 stretch) |
| Joint — Best Private Nanopayments | P1 + P2 + P4 (one contiguous flow) |

## Definition of "entirely finished"
1. `npm run typecheck && npm test && npm run build` green (incl. un-skipped `arc-live`, `unlink-live`).
2. `BASE_URL=https://pearpay.app npm run judge:demo` → 3/3 sections exit 0.
3. One contiguous live demo: intent → FaceID → Flow bridge → Unlink burner shield → Circle Gateway batched x402 settle → ArcScan hash → burner disposed.
4. Video recorded, attribution + submission filed.
