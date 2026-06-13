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

## Phase 3 — Dynamic Flow + Arc ✅ (scaffold)

- [x] TypeScript Flow client (`src/integrations/flow/client.ts`)
- [x] `/api/flow/payment/*` routes
- [x] `useFlowPayment` hook + Dynamic wallet UI
- [ ] Wire Dynamic + Arc USDC keys
- [ ] One real cross-chain Flow payment on testnet

---

## Phase 4 — Agent x402 ✅ (scaffold)

- [x] `/api/agent/*` routes + `AgentDemo` on homepage
- [x] `/api/x402/premium/data` paywalled endpoint
- [ ] Real Dynamic server wallet + x402 gateway (optional)

---

## Phase 5 — Deploy + Video

- [ ] Push `integration/cursor-flow-agent` → merge to `main`
- [ ] Vercel production deploy
- [ ] Record 2–4 min demo video per `DYNAMIC_BOUNTY.md`
- [ ] Submit to ETHGlobal
