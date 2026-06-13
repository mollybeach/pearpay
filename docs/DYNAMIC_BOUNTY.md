# Dynamic Flow + Agentic Build — PearPay

PearPay is a unified Next.js app for conversational payments, biometric approval, cross-chain Flow settlement, and autonomous agent payments.

**Live app:** [https://pearpay.app/](https://pearpay.app/)

## Judging narrative (say this in demo video)

> "A user types *Pay the security agent $45* in chat. PearPay's NLP engine **proposes** the payment — it never holds keys. The user taps the Apple Pay card, **FaceID** fires via WebAuthn, then **Fireblocks Flow** routes funds from whatever chain and token they hold — ETH on Arbitrum, USDC on Base — and **settles USDC on Arc** to the agent wallet. Meanwhile, the **security agent** uses a **Dynamic server wallet** to autonomously pay x402-gated APIs without human approval per call."

## Bounty alignment

| Bounty | How PearPay qualifies |
|--------|-------------------------|
| **Best Use of Flow ($3k)** | Full 8-step checkout via `/api/flow/payment/*`: create transaction → attach source → quote → prepare → sign → broadcast → webhook/poll settlement. |
| **Best Agentic Build ($2k)** | Dynamic server wallet + `/api/agent/run-intent` autonomously hits 402, pays, retries. Action log at `/api/agent/actions`. |

## Required env vars

See [`.env.example`](.env.example). Key vars:

```bash
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=...
DYNAMIC_ENV_ID=...
DYNAMIC_API_TOKEN=dyn_...
ARC_USDC_ADDRESS=0x...
NEXT_PUBLIC_ARC_USDC_ADDRESS=0x...
DYNAMIC_FLOW_CHECKOUT_ID=...          # optional
DYNAMIC_FLOW_WEBHOOK_SECRET=...
AGENT_WALLET_ADDRESS=0x...            # optional
```

## Demo script for judges

### Human + Flow (Best Use of Flow)

1. `POST /api/payments` with message *"Send Molly $20"* → copy `payUrl` from response
2. Open pay link in iMessage (HTTPS) or Safari — OG card unfurls
3. Connect Dynamic wallet · Tap **Pay with Face ID + Flow**
4. Show Flow quote → sign → Arc explorer
5. Webhook events at `GET /api/webhooks/flow`

### Agent autonomy (Best Agentic Build)

1. Home page → **Run Autonomous Agent**
2. Intent: *"Fetch premium agent intelligence"*
3. Action log: `propose` → `decide` → `execute` → `complete`
4. 402 → pay → 200 from `/api/x402/premium/data`

## API reference

| Endpoint | Purpose |
|----------|---------|
| `POST /api/flow/payment/start` | Create Flow checkout transaction |
| `POST /api/flow/payment/source` | Attach payer wallet + chain |
| `POST /api/flow/payment/quote` | Cross-chain swap quote |
| `POST /api/flow/payment/prepare` | Get signing payload |
| `POST /api/flow/payment/broadcast` | Record tx hash |
| `GET /api/flow/payment/status/{intentId}` | Poll settlement |
| `POST /api/webhooks/flow` | HMAC webhook receiver |
| `POST /api/agent/run-intent` | Autonomous agent execution |
| `GET /api/agent/actions` | Agent decision audit log |
| `GET /pay/{data}` | Shareable pay page with OG unfurl |

## Architecture

```
Human path:
  NLP (Molly) → payUrl → WebAuthn FaceID → Flow → USDC on Arc

Agent path:
  Agent intent → server wallet → x402 pay → API access
```

## Team Scope

- Conversational payment parser, recipient resolution, escrow, channels, iOS, and contracts
- Flow API, WebAuthn, OG pay page, agent x402 demo, and Dynamic wallet experience
