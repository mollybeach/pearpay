# Dynamic Flow + Agentic Build — PearPay

## Judging narrative (say this in demo video)

> "A user types *Pay the security agent $45* in chat. PearPay's NLP engine **proposes** the payment — it never holds keys. The user taps the Apple Pay card, **FaceID** fires via WebAuthn, then **Fireblocks Flow** routes funds from whatever chain and token they hold — ETH on Arbitrum, USDC on Base — and **settles USDC on Arc** to the agent wallet. Meanwhile, the **security agent** uses a **Dynamic server wallet** to autonomously pay x402-gated APIs without human approval per call."

## Bounty alignment

| Bounty | How PearPay qualifies |
|--------|-------------------------|
| **Best Use of Flow ($3k)** | Full 8-step checkout: create transaction → attach source → quote → prepare → sign → broadcast → webhook/poll settlement. Per-payment `destinationAddresses` routes to agent recipient on Arc. |
| **Best Agentic Build ($2k)** | Python `dynamic-wallet-sdk` server wallet. `/agent/run-intent` autonomously hits 402, pays, retries. Action log proves agent decides + executes. |

## Required env vars

```bash
# Dynamic dashboard → Developer → API
DYNAMIC_ENVIRONMENT_ID=...
DYNAMIC_API_TOKEN=dyn_...

# Arc testnet USDC contract
ARC_USDC_ADDRESS=0x...
NEXT_PUBLIC_ARC_USDC_ADDRESS=0x...

# Optional — reuse existing Flow checkout
DYNAMIC_FLOW_CHECKOUT_ID=...

# Agent server wallet
DYNAMIC_WALLET_PASSWORD=secure-password
AGENT_WALLET_ADDRESS=0x...   # or leave empty to auto-create

# Webhook (register in Dynamic dashboard)
DYNAMIC_FLOW_WEBHOOK_SECRET=...
# Point webhook URL to: https://your-engine.com/webhooks/flow
```

## Enable Flow in Dynamic dashboard

1. [Book a call](https://www.dynamic.xyz/book-a-call) or enable Flow for hackathon environment
2. Enable **embedded wallets** under Wallets
3. Enable **Arc Testnet** (chain ID `5042002`) under Chains
4. Create API token with checkout permissions

## Demo script for judges

### Human + Flow (Best Use of Flow)

1. Connect Dynamic embedded wallet funded on **any** chain (e.g. Arbitrum ETH)
2. Generate pay link: *"Pay the security agent $45"*
3. Open in iMessage (deployed HTTPS) or Safari
4. Tap **Pay with Face ID + Flow**
5. Show Flow quote (from_amount, fees, routing)
6. Sign transaction
7. Show Arc explorer + webhook event at `/webhooks/flow/events`

### Agent autonomy (Best Agentic Build)

1. Home page → **Run Autonomous Agent**
2. Intent: *"Fetch premium agent intelligence"*
3. Show action log: `propose` → `decide` → `execute` → `complete`
4. Show 402 → pay → 200 response from `/x402/premium/data`

## API reference

| Endpoint | Purpose |
|----------|---------|
| `POST /flow/payment/start` | Create Flow checkout transaction |
| `POST /flow/payment/source` | Attach payer wallet + chain |
| `POST /flow/payment/quote` | Cross-chain swap quote |
| `POST /flow/payment/prepare` | Get signing payload |
| `POST /flow/payment/broadcast` | Record tx hash |
| `GET /flow/payment/status/{intent_id}` | Poll settlement |
| `POST /webhooks/flow` | HMAC webhook receiver |
| `POST /agent/run-intent` | Autonomous agent execution |
| `GET /agent/actions` | Agent decision audit log |

## Architecture

```
Human path:
  NLP propose → WebAuthn FaceID → Flow (any chain in) → USDC on Arc out

Agent path:
  NLP intent → server wallet decides → x402 pay → API access
  (wrong chain? Flow API funds agent wallet — same infra)
```

## Docs

- [Fireblocks Flow overview](https://www.dynamic.xyz/docs/overview/fireblocks-flow)
- [Flow API guide](https://www.dynamic.xyz/docs/overview/fireblocks-flow-api)
- [Agents overview](https://www.dynamic.xyz/docs/overview/agents/overview)
- [Agent payments](https://www.dynamic.xyz/docs/overview/agents/agent-payments)
- [Flow demo site](https://flow.dynamic.dev/)
