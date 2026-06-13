# Dynamic Setup — Pear Pay (ETHGlobal NYC 2026)

Pear Pay targets two Dynamic prize tracks:

- **Best Use of Flow ($3,000)** — cross-chain pay, settle USDC on Arc
- **Best Agentic Build ($2,000)** — server wallet signs autonomous x402 payments

References:

- [Fireblocks Flow overview](https://www.dynamic.xyz/docs/overview/fireblocks-flow)
- [Flow API guide](https://www.dynamic.xyz/docs/overview/fireblocks-flow-api)
- [Agents overview](https://www.dynamic.xyz/docs/overview/agents/overview)
- [Agent payments](https://www.dynamic.xyz/docs/overview/agents/agent-payments)
- [Node SDK quickstart](https://www.dynamic.xyz/docs/node/quickstart)
- [Flow live demo](https://flow.dynamic.dev/)

## Dashboard checklist

1. Create a project at [Dynamic Dashboard](https://app.dynamic.xyz/)
2. Copy **Environment ID** from Developer → API
3. Create **API token** (`dyn_...`) with wallet + checkout permissions
4. Enable **Wallets → Embedded wallets**
5. Enable chains:
   - **Arc Testnet** (chain `5042002`) — settlement destination
   - **Base** and/or **Ethereum** — common payer source chains
6. Enable **Fireblocks Flow** (open for ETHGlobal NY 2026)
7. Optional: create a payment checkout settling USDC on Arc → save `DYNAMIC_FLOW_CHECKOUT_ID`
8. Optional: set webhook URL to `https://your-domain/api/webhooks/flow` with `DYNAMIC_FLOW_WEBHOOK_SECRET`

## Local `.env`

```bash
# Dynamic client + server
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-env-id
DYNAMIC_ENV_ID=your-env-id
DYNAMIC_API_TOKEN=dyn_...
DYNAMIC_WALLET_PASSWORD=choose-a-strong-password
DYNAMIC_FLOW_CHECKOUT_ID=
DYNAMIC_FLOW_WEBHOOK_SECRET=
AGENT_WALLET_ADDRESS=

# Arc settlement (Flow destination)
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app

# App
APP_URL=http://localhost:3000
WEBAUTHN_ORIGIN=http://localhost:3000
```

## Verify locally

```bash
npm run dev
curl http://localhost:3000/api/flow/status
curl http://localhost:3000/api/agent/status
```

### Flow payment demo

1. `POST /api/payments` with message like *"Send molly.eth $5"*
2. Open `payUrl` from response
3. Connect Dynamic wallet (funded on Base or Ethereum)
4. Tap **Pay with Face ID + Flow**
5. Confirm quote → sign → settlement on Arc

### Agent demo

1. Homepage → **Run Autonomous Agent**
2. Intent: *"Fetch premium agent intelligence"*
3. Agent server wallet signs x402 payment → unlocks `/api/x402/premium/data`

## Human checklist before judging

- [ ] Dynamic Environment ID + `dyn_` API token
- [ ] Embedded wallets + Flow enabled in dashboard
- [ ] Arc Testnet enabled as settlement chain
- [ ] Payer wallet funded on a non-Arc chain (e.g. Base USDC/ETH)
- [ ] `DYNAMIC_WALLET_PASSWORD` set for agent server wallet
- [ ] Deploy to Vercel with all env vars (for judges)
- [ ] Register Flow webhook on production URL
