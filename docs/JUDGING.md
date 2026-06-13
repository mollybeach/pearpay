# Live Judging — Pear Pay Demo Guide

**When:** Sunday, June 14, 2026 · **2:30 PM EDT**  
**Live app:** [https://pearpay.app/](https://pearpay.app/)  
**Prize tabs:** [https://pearpay.app/prizes](https://pearpay.app/prizes)

Pear Pay targets three partner prize pools: **Arc ($15k)**, **Dynamic ($10k)**, and **Unlink ($5k)**. Each pool has its own judging brief, verification script, and demo script below.

---

## Run all checks before judging

```bash
npm run judge:demo
```

Or run each pool individually:

| Pool | Script | Doc |
|------|--------|-----|
| Arc | `npm run verify:arc` | [`docs/ARC_BOUNTY.md`](./ARC_BOUNTY.md) |
| Dynamic | `npm run verify:dynamic` | [`docs/DYNAMIC_BOUNTY.md`](./DYNAMIC_BOUNTY.md) |
| Unlink | `npm run verify:unlink` | [`docs/UNLINK_BOUNTY.md`](./UNLINK_BOUNTY.md) |

Start the dev server for UI demos:

```bash
npm run dev
# → http://localhost:3000
```

---

## What to show judges (2–4 min video / booth)

| # | Surface | URL | Proves |
|---|---------|-----|--------|
| 1 | **Simulator** | `/messages` | Conversational UX across 6 channels |
| 2 | **Private send** | `/messages` → type *"Send Sasha 50 USDC privately"* | Unlink rail + shielded card |
| 3 | **Try it** | `/pay` | Real on-chain USDC (browser wallet) |
| 4 | **Prize evidence** | `/prizes` | Arc / Dynamic / Unlink tabs with code links |
| 5 | **Flow checkout** | `/pay/{intent}` from API | Dynamic Flow → Arc settlement |
| 6 | **Agent x402** | Home → Run Autonomous Agent | Dynamic server wallet pays 402 APIs |

**Name the bounty explicitly** when demoing (e.g. *"Arc — Best Smart Contracts with Advanced Stablecoin Logic"*).

---

## Pool-specific guides

### Arc — $15,000

**Tracks:** Best Smart Contracts on Arc · Best Chain Abstracted USDC Apps

- **Brief:** [`docs/ARC_BOUNTY.md`](./ARC_BOUNTY.md)
- **Verify:** `npm run verify:arc` — deploys (if needed), escrows 0.01 USDC, claims, prints ArcScan URLs
- **Key code:** `contracts/PearPayEscrow.sol`, `src/integrations/arc/`, `src/core/payments/settlement.ts`
- **Say:** *Users never pick a chain — Pear Pay routes USDC through Arc; claimable payments use PearPayEscrow on Arc Testnet (5042002).*

### Dynamic — $10,000

**Tracks:** Best Use of Flow · Best Agentic Build · Best Overall Use · Joint private nanopayments (w/ Unlink + Arc)

- **Brief:** [`docs/DYNAMIC_BOUNTY.md`](./DYNAMIC_BOUNTY.md)
- **Verify:** `npm run verify:dynamic` — checks env + Flow/x402 unit tests
- **Key code:** `src/integrations/dynamic/`, `app/api/flow/payment/*`, `app/api/agent/run-intent/route.ts`
- **Say:** *Dynamic embedded wallets for claim-onboarding, Flow for cross-chain checkout settling on Arc, server wallets for autonomous x402 agent payments.*

### Unlink — $5,000

**Tracks:** Best Private Nano Payment App (joint) · Best Unlink Integration into a Major Open-Source App

- **Brief:** [`docs/UNLINK_BOUNTY.md`](./UNLINK_BOUNTY.md)
- **Verify:** `npm run verify:unlink` — checks env, registers SDK client, hits `/api/privacy/shield`
- **Key code:** `src/integrations/unlink/index.ts`, `src/core/payments/settlement.ts`, `app/api/privacy/shield/route.ts`
- **Say:** *Add "privately" to any message — orchestrator selects the Unlink rail; deposit/transfer/withdraw hide amounts and counterparties while Arc still settles the public leg when needed.*

---

## Env vars by pool (never commit secrets)

See [`docs/ENV_SETUP.md`](./ENV_SETUP.md) for full setup. Minimum for live judging:

```bash
# Arc
FUNDER_PRIVATE_KEY=0x...
ARC_ESCROW_CONTRACT_ADDRESS=0x...
ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002

# Dynamic
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=...
DYNAMIC_ENV_ID=...
DYNAMIC_API_TOKEN=dyn_...

# Unlink (see docs/UNLINK_BOUNTY.md)
UNLINK_API_KEY=...                              # dashboard.unlink.xyz → API Keys
UNLINK_ENGINE_URL=https://arc-testnet-production-api.unlink.xyz
UNLINK_PROJECT_ID=...                           # dashboard project UUID (reference only)
UNLINK_ACCOUNT_MNEMONIC="twelve word phrase"    # cast wallet new-mnemonic — NOT cast wallet new
UNLINK_ENVIRONMENT=arc-testnet
```

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`docs/Submission.md`](./Submission.md) | ETHGlobal form answers |
| [`docs/unlink-integration.md`](./unlink-integration.md) | Unlink SDK + privacy model |
| [`docs/DYNAMIC_SETUP.md`](./DYNAMIC_SETUP.md) | Dynamic dashboard checklist |
| [`README.md`](../README.md) | Architecture + prize strategy |
