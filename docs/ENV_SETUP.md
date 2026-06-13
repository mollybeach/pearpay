# Environment Variables — How to Obtain Every Value

Pear Pay reads configuration from `.env` (local dev) or your deployment host (Vercel, etc.). Copy [`.env.example`](../.env.example) to get started:

```bash
cp .env.example .env
```

**Last updated:** 2026-06-13

---

## Table of contents

1. [What you need when](#what-you-need-when)
2. [App URLs](#1-app-urls)
3. [Dynamic (wallets, Flow, agents)](#2-dynamic-wallets-flow-agents)
4. [Arc / Circle (settlement + escrow)](#3-arc--circle-settlement--escrow)
5. [WebAuthn / Face ID](#4-webauthn--face-id)
6. [x402 (agent micropayments)](#5-x402-agent-micropayments)
7. [Unlink (private payments)](#6-unlink-private-payments)
8. [Twilio (SMS / WhatsApp / Verify)](#7-twilio-sms--whatsapp--verify)
9. [Ethereum RPC](#8-ethereum-rpc)
10. [Persistence (Supabase)](#9-persistence-supabase)
11. [Production on pearpay.app](#production-on-pearpayapp)
12. [Security checklist](#security-checklist)

---

## What you need when

| Goal | Minimum env |
|------|-------------|
| **Local dev / judges demo (stub mode)** | Nothing — defaults + in-memory escrow work offline |
| **Simulator + Try it (Base Sepolia)** | No server keys — browser wallet only on `/pay` |
| **Live Arc escrow deploy** | `PRIVATE_KEY`, `ARC_RPC_URL`, funded testnet USDC |
| **Live Dynamic + Flow** | `DYNAMIC_*`, `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` |
| **Live Unlink private mode** | `UNLINK_API_KEY`, `UNLINK_ENGINE_URL`, `UNLINK_ACCOUNT_MNEMONIC` |
| **Live Twilio claims** | All `TWILIO_*` vars + public webhook URL |
| **Production** | All of the above + `ESCROW_DATABASE_URL` + domain URLs |

Pear Pay **stub mode**: when sponsor keys are missing, integrations return deterministic fake receipts so demos and tests run without funded accounts. Set real keys only when you need live on-chain or live API behavior.

---

## 1. App URLs

| Variable | Local | Production | How to obtain |
|----------|-------|------------|---------------|
| `APP_URL` | `http://localhost:3000` | `https://pearpay.app` | Your public origin — used for claim links, pay links, webhooks |
| `NEXT_PUBLIC_APP_URL` | same as above | same | Must match `APP_URL` in production (exposed to browser) |
| `NEXT_PUBLIC_SITE_URL` | same as above | same | Used for OG/social preview `metadataBase` in `app/layout.tsx` |
| `VERCEL_URL` | *(leave empty locally)* | auto-set by Vercel | Do not set manually — Vercel injects `*.vercel.app` on preview deploys |

**Production:** attach [pearpay.app](https://pearpay.app/) in Vercel → Domains, then set all three URL vars to `https://pearpay.app`.

---

## 2. Dynamic (wallets, Flow, agents)

Docs: [Dynamic overview](https://www.dynamic.xyz/docs) · [Flow](https://www.dynamic.xyz/docs/overview/fireblocks-flow) · [Agent wallets](https://www.dynamic.xyz/docs/overview/agents/overview)

| Variable | Required for | How to obtain |
|----------|--------------|---------------|
| `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` | Embedded wallet UI | [Dynamic Dashboard](https://app.dynamic.xyz) → your environment → **Environment ID** (same UUID as below) |
| `DYNAMIC_ENV_ID` | Server API | Same Environment ID as the public var |
| `DYNAMIC_API_TOKEN` | Server wallet + user lookup | Dashboard → **Developer Settings** → **API Tokens** → Create token (`dyn_…`) |
| `DYNAMIC_FLOW_CHECKOUT_ID` | Live Flow checkout | Dashboard → Flow / checkout config (optional for stub Flow) |
| `DYNAMIC_FLOW_WEBHOOK_SECRET` | Verify Flow webhooks | Generate when registering webhook URL → `https://pearpay.app/api/webhooks/flow` |
| `DYNAMIC_WALLET_PASSWORD` | Encrypted server wallet export | Set when creating a password-protected server wallet (optional) |
| `AGENT_WALLET_ADDRESS` | Skip auto-create agent | Paste address after first run of `POST /api/agent/initialize`, or leave empty to auto-provision |

**Steps:**

1. Sign up at [app.dynamic.xyz](https://app.dynamic.xyz).
2. Create a project/environment for **EVM** chains.
3. Copy **Environment ID** → `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` and `DYNAMIC_ENV_ID`.
4. Create an **API token** with wallet permissions → `DYNAMIC_API_TOKEN`.
5. Enable **Embedded Wallets** and **Server Wallets** in the dashboard.
6. For Flow: configure Arc as destination chain + USDC token; register webhook to `/api/webhooks/flow`.

See also [`docs/DYNAMIC_BOUNTY.md`](./DYNAMIC_BOUNTY.md) for the judge demo script.

---

## 3. Arc / Circle (settlement + escrow)

Docs: [Deploy on Arc](https://docs.arc.network/integrate/deploy-on-arc) · [Circle API keys](https://developers.circle.com/api-reference/keys) · [USDC on Arc](https://developers.circle.com/stablecoins/usdc-contract-addresses)

### Network defaults (testnet — usually copy as-is)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_ARC_CHAIN_ID` | `5042002` |
| `ARC_RPC_URL` / `NEXT_PUBLIC_ARC_RPC_URL` | `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_ARC_EXPLORER_URL` | `https://testnet.arcscan.app` |
| `ARC_USDC_ADDRESS` / `NEXT_PUBLIC_ARC_USDC_ADDRESS` | `0x3600000000000000000000000000000000000000` |
| `ARC_EURC_ADDRESS` / `NEXT_PUBLIC_ARC_EURC_ADDRESS` | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |

> **Note:** `CHAIN_ID=1` at the bottom of `.env.example` is for **Ethereum mainnet**, not Arc. Arc always uses chain ID **5042002** via `NEXT_PUBLIC_ARC_CHAIN_ID`.

### Wallet private keys

Arc uses **USDC as gas** — no ETH faucet needed.

**Generate a deployer / funder wallet** (requires [Foundry](https://book.getfoundry.sh/getting-started/installation)):

```bash
cast wallet new
```

| Output | Env var |
|--------|---------|
| Private key (`0x…`) | `PRIVATE_KEY` — Foundry deploy script |
| Same key (OK for hackathon) | `FUNDER_PRIVATE_KEY` — live Arc settlement + x402 in the app |

**Fund the wallet:**

1. Copy the **Address** from `cast wallet new`.
2. Open [Circle Testnet Faucet](https://faucet.circle.com/).
3. Select **Arc Testnet** → request **USDC** (and optionally **EURC**).
4. Confirm on [Arc Testnet Explorer](https://testnet.arcscan.app/).

### Circle API key

| Variable | How to obtain |
|----------|---------------|
| `CIRCLE_API_KEY` | [Circle Developer Console](https://console.circle.com/signup) → **API & Client Keys** → **Create a key** → **API Key** (testnet format: `TEST_API_KEY:…`) |

Optional for local dev — without it, Arc settlement returns deterministic stub receipts. Required for live Gateway / production Arc flows.

### Deploy escrow contract

```bash
# Load PRIVATE_KEY and ARC_RPC_URL from .env first
forge script contracts/script/DeployPearPayEscrow.s.sol \
  --rpc-url "$ARC_RPC_URL" \
  --broadcast
```

| Variable | How to obtain |
|----------|---------------|
| `ARC_ESCROW_CONTRACT_ADDRESS` | Address printed after deploy |
| `ESCROW_CONTRACT_ADDRESS` | Same address (alias used by production checks) |

See [`contracts/README.md`](../contracts/README.md) and [`docs/ARC_BOUNTY.md`](./ARC_BOUNTY.md).

---

## 4. WebAuthn / Face ID

Used for **Pay with Face ID** in the browser (`@simplewebauthn`).

| Variable | Local | Production | How to obtain |
|----------|-------|------------|---------------|
| `WEBAUTHN_RP_ID` | `localhost` | `pearpay.app` | Relying party ID = domain **without** `https://` |
| `WEBAUTHN_RP_NAME` | `PearPay` | `Pear Pay` | Display name shown in the passkey prompt |
| `WEBAUTHN_ORIGIN` | `http://localhost:3000` | `https://pearpay.app` | Must exactly match the page origin (scheme + host + port) |
| `WEBAUTHN_STORE_PATH` | *(optional)* | path or DB | Defaults to `.webauthn-store.json` in repo root for local dev |

**Production:** WebAuthn only works on **HTTPS** with a real domain. Set `WEBAUTHN_RP_ID=pearpay.app` and `WEBAUTHN_ORIGIN=https://pearpay.app`. Passkeys registered on `localhost` do not transfer to production.

---

## 5. x402 (agent micropayments)

Used by `/api/x402/pay` and the autonomous agent demo.

| Variable | How to obtain |
|----------|---------------|
| `FUNDER_PRIVATE_KEY` | Same as Arc funder wallet — see [Arc wallet](#wallet-private-keys). Must hold USDC on Arc testnet. |
| `X402_GATEWAY_ADDRESS` | Deploy or obtain from Circle x402 / Gateway docs when wiring live agent pay; optional for stub demo |

Check status: `GET /api/x402/status` returns whether funder + RPC are configured.

---

## 6. Unlink (private payments)

Docs: [Unlink docs](https://docs.unlink.xyz) · [Partner guide (Dynamic × Unlink × Arc)](https://docs.unlink.xyz/partner-integrations)

| Variable | How to obtain |
|----------|---------------|
| `UNLINK_API_KEY` | Unlink developer onboarding / ETHGlobal sponsor desk / [docs quickstart](https://docs.unlink.xyz) |
| `UNLINK_ENGINE_URL` | Engine endpoint for your environment (e.g. arc-testnet) — provided with API access |
| `UNLINK_ENVIRONMENT` | `arc-testnet` (default — matches Pear Pay's Arc settlement chain) |
| `UNLINK_ACCOUNT_MNEMONIC` | Generate a **new** 12- or 24-word BIP-39 mnemonic for the server-side Unlink account (`unlinkAccount.fromMnemonic`). **Never reuse a personal wallet seed.** |

All three of `UNLINK_API_KEY`, `UNLINK_ENGINE_URL`, and `UNLINK_ACCOUNT_MNEMONIC` must be set for live private transfers. Otherwise `privateTransfer()` returns deterministic stubs.

Verify:

```bash
curl -s -X POST http://localhost:3000/api/privacy/shield \
  -H 'content-type: application/json' \
  -d '{"amount":50,"recipient":"+15555550123","intent_id":"test-1"}'
```

See [`docs/unlink-integration.md`](./unlink-integration.md) for the full privacy flow.

---

## 7. Twilio (SMS / WhatsApp / Verify)

Docs: [Twilio Console](https://console.twilio.com/) · [Messaging Services](https://www.twilio.com/docs/messaging/services)

| Variable | How to obtain |
|----------|---------------|
| `TWILIO_ACCOUNT_SID` | Console home → **Account Info** → Account SID (`AC…`) |
| `TWILIO_AUTH_TOKEN` | Same panel → Auth Token (rotate if exposed) |
| `TWILIO_MESSAGING_SERVICE_SID` | Console → **Messaging** → **Services** → create service → SID (`MG…`) |
| `TWILIO_VERIFY_SERVICE_SID` | Console → **Verify** → Services → create → SID (`VA…`) |
| `TWILIO_FROM_NUMBER` | Console → **Phone Numbers** → buy a number (or use trial number for dev) |
| `TWILIO_WEBHOOK_URL` | Your public base + `/api/webhooks/twilio` → e.g. `https://pearpay.app/api/webhooks/twilio` |

**Steps:**

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio).
2. Copy Account SID + Auth Token.
3. Create a **Messaging Service** for SMS/WhatsApp claim links.
4. Create a **Verify** service for OTP flows.
5. Configure inbound webhook on the messaging service to point at your deployed `/api/webhooks/twilio`.

Trial accounts can only message verified numbers until upgraded.

---

## 8. Ethereum RPC

General-purpose Ethereum RPC for viem reads.

| Variable | How to obtain |
|----------|---------------|
| `RPC_URL` | Ethereum JSON-RPC URL — [Alchemy](https://www.alchemy.com/), [Infura](https://infura.io/), [QuickNode](https://www.quicknode.com/), etc. |
| `CHAIN_ID` | `1` for Ethereum mainnet — **not** Arc's `5042002` |

Optional for demos. Recipients are resolved by phone, email, @handle, or raw `0x` address.

---

## 9. Persistence (Supabase)

| Variable | How to obtain |
|----------|---------------|
| `ESCROW_DATABASE_URL` | [Supabase](https://supabase.com/) → New project → **Settings** → **Database** → **Connection string** (URI format, prefer pooler for serverless) |

Hackathon MVP uses an **in-memory** `EscrowStore` when this is unset. Set `ESCROW_DATABASE_URL` before production so claimable payments survive restarts.

---

## Production on pearpay.app

Set these together when going live:

```bash
APP_URL=https://pearpay.app
NEXT_PUBLIC_APP_URL=https://pearpay.app
NEXT_PUBLIC_SITE_URL=https://pearpay.app
WEBAUTHN_RP_ID=pearpay.app
WEBAUTHN_ORIGIN=https://pearpay.app
TWILIO_WEBHOOK_URL=https://pearpay.app/api/webhooks/twilio
# Register in Dynamic dashboard:
# https://pearpay.app/api/webhooks/flow
```

Run production readiness check in code: `getProductionReadiness()` in `src/lib/env.ts` lists missing vars per integration.

---

## Security checklist

- **Never commit** `.env` or real private keys — they are in [`.gitignore`](../.gitignore).
- Use **separate wallets** for deploy (`PRIVATE_KEY`) vs treasury in production.
- Rotate any key that appears in chat, screenshots, or git history.
- `UNLINK_ACCOUNT_MNEMONIC` and `FUNDER_PRIVATE_KEY` are **hot wallet secrets** — scope access to deployment env only.
- WebAuthn passkeys are domain-bound — re-register on production domain.
- Twilio trial keys and Dynamic test tokens are not production-grade — upgrade before mainnet.

---

## Related docs

| Doc | Topic |
|-----|-------|
| [`.env.example`](../.env.example) | Copy-paste template |
| [`docs/ARC_BOUNTY.md`](./ARC_BOUNTY.md) | Arc demo + deploy script |
| [`docs/DYNAMIC_BOUNTY.md`](./DYNAMIC_BOUNTY.md) | Dynamic + Flow env vars |
| [`docs/unlink-integration.md`](./unlink-integration.md) | Unlink private mode |
| [`docs/Submission.md`](./Submission.md) | ETHGlobal form answers |
