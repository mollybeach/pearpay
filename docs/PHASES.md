# PearPay Build Phases

Hard deadline: **Sunday 9:00 AM**. Single unified app in this repo.

## Phase 0 — Scaffolding ✅

- [x] Unified Next.js app
- [x] NLP parser, orchestrator, escrow, channels
- [x] Parser + money + escrow + payload tests

**Run locally:**
```bash
cd pearpay-molly
npm install
npm run dev
```

---

## Phase 1 — OG Unfurl ✅

- [x] `generateMetadata()` on `/pay/[data]`
- [x] Dynamic `opengraph-image.tsx` (1200×630)
- [x] Orchestrator returns `payUrl` on instant legs
- [ ] Deploy to Vercel — custom domain https://pearpay.app/ · set `NEXT_PUBLIC_APP_URL`
- [ ] Test unfurl in iMessage on iPhone

---

## Phase 2 — WebAuthn / FaceID ✅

- [x] `@simplewebauthn` register + authenticate API routes
- [x] `useWebAuthn` hook + Pay with Face ID button
- [ ] Set `WEBAUTHN_RP_ID` to Vercel domain for prod
- [ ] Test FaceID on physical iPhone via Safari

---

## Phase 3 — Dynamic Flow + Arc (live wiring)

- [x] TypeScript Flow client (`src/integrations/flow/client.ts`)
- [x] Persistent Flow session store (`.flow-store.json`)
- [x] `/api/flow/payment/*` routes + HMAC webhooks
- [x] `useFlowPayment` hook + wallet-gated Dynamic pay UI
- [ ] Set Dynamic env vars in `.env` (see `docs/DYNAMIC_SETUP.md`)
- [ ] One real cross-chain Flow payment on testnet

---

## Phase 4 — Agent x402 (live wiring)

- [x] `/api/agent/*` routes + `AgentDemo` on homepage
- [x] Dynamic Node server wallet SDK (`@dynamic-labs-wallet/node-evm`)
- [x] Signed x402 payment proofs via server wallet
- [ ] Set `DYNAMIC_WALLET_PASSWORD` and run live agent demo

---

## Phase 5 — Deploy + Video

- [ ] Push `integration/cursor-flow-agent` → merge to `main`
- [ ] Vercel production deploy
- [ ] Record 2–4 min demo video per `DYNAMIC_BOUNTY.md`
- [ ] Submit to ETHGlobal
