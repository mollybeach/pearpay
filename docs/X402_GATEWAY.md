# Circle Gateway x402 — Real Batched Nanopayments

Replaces the demo EIP-191 x402 with the **real Circle Gateway batched settlement**
(`@circle-fin/x402-batching@3.0.4`) on **Arc Testnet (`eip155:5042002`)**.
This is the prize-critical Arc + Agentic + joint-Private-Nanopayments rail.

## Verified facts (from the published SDK types, not guessed)
- Package: `@circle-fin/x402-batching@3.0.4` — subpaths `./client`, `./server`; peers `viem`, `@x402/core`, `@x402/evm`.
- **Server**: `new BatchFacilitatorClient(config?)` → `.verify(payload, requirements)` → `{ isValid, invalidReason?, payer? }`; `.settle(...)` → `{ success, errorReason?, payer?, transaction, network }`.
- **Client**: `new GatewayClient({ chain, privateKey, rpcUrl? })` → `.deposit(amount)`, `.supports(url)`, **`.pay(url)`** (does the full 402→EIP-3009 sign→retry internally), `.getUsdcBalance()`.
- Constants: `x402Version = 2`, USDC `0x3600…0000`, GatewayWallet `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`.

## Files
| File | Role |
|------|------|
| `src/integrations/arc/x402-gateway.ts` | Core: requirements builder, 402 body, verify+settle (seller), `agentGatewayPay` (buyer) |
| `app/api/x402/premium/data/route.ts` | Seller endpoint: 402 → verify → settle → data + `X-Payment-Response` |
| `app/api/agent/autonomous-pay/route.ts` | Buyer: uses `GatewayClient.pay()` when configured |
| `tests/x402-gateway.test.ts` | Unit tests for the pure helpers |

The SDK is loaded via a runtime dynamic import (variable specifier + `webpackIgnore`),
so `tsc` and `next build` stay green before `npm i`. Local interfaces mirror the
published `.d.ts`. A legacy EIP-191 fallback remains so the no-Circle demo still runs.

## Install (you run this)
```bash
npm i @circle-fin/x402-batching @x402/core @x402/evm
```

## Env (add to .env)
```bash
X402_SELLER_ADDRESS=0x...        # who receives settlement (the agent/merchant)
X402_BUYER_PRIVATE_KEY=0x...     # agent key that signs payments (or reuse FUNDER_PRIVATE_KEY)
X402_CHAIN_NAME=                 # Circle SupportedChainName for Arc testnet — confirm exact literal:
# node -e "const c=require('@circle-fin/x402-batching/client'); console.log(Object.keys(c))"
X402_FACILITATOR_URL=            # optional override; default uses Circle's hosted facilitator
# X402_GATEWAY_ADDRESS already exists; defaults to 0x0077777d7EBA4688BDeF3E311b846F25870A19B9
```

## Flow
```
Agent: GatewayClient.deposit("1.00")  →  GatewayClient.pay(/api/x402/premium/data)
                                              │  402 { accepts:[requirements] }
                                              │  signs EIP-3009 against GatewayWallet
                                              ▼
Seller route: BatchFacilitatorClient.verify() → .settle()  →  gas-free batched tx on Arc
                                              ▼
              returns dataset + X-Payment-Response (settlement tx hash)
```

## Verify locally (you run, after install + env + `npm run dev`)
```bash
# 1. 402 challenge:
curl -i http://localhost:3000/api/x402/premium/data        # expect HTTP 402 + accepts[]
# 2. autonomous agent pays:
curl -s -X POST http://localhost:3000/api/agent/autonomous-pay \
  -H 'content-type: application/json' \
  -d '{"url":"http://localhost:3000/api/x402/premium/data","deposit_usd":"1.00"}' | jq .
# expect: { mode:"gateway", paid:true, payTx:"0x...", data:{ dataset:... } }
```
The settlement tx hash should appear on `https://testnet.arcscan.app`.
