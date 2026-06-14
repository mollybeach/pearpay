> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fireblocks Flow API guide

> Implement payment, deposit, and withdrawal flows with raw HTTP calls to the Fireblocks Flow checkout endpoints.

<Note>
  This is an enterprise-only feature. Please [contact us](https://www.dynamic.xyz/book-a-call) to enable.
</Note>

## What We're Building

A server-side payment flow built on [Fireblocks Flow](/overview/fireblocks-flow). Fireblocks Flow lets you accept a crypto payment from any supported chain, wallet, or exchange and have it settled in a specific token on a specific chain. This guide uses its API directly (the `checkout` endpoints). By the end of this guide you will be able to:

* Create a checkout configuration and reuse its `checkoutId` when settlement and destinations stay the same
* Walk through the full payment flow: create transaction, attach source, get quote, sign, broadcast
* Send withdrawals from your treasury or vault to end-user wallets (API only)
* Poll or receive webhooks for settlement completion
* Handle errors and edge cases

This guide uses raw HTTP calls, making it suitable for backend services, AI agents, cron jobs, or any language with `fetch`. For an overview of what Fireblocks Flow can do — funding sources, settlement currencies, compliance, and webhooks — see the [Fireblocks Flow overview](/overview/fireblocks-flow).

## Prerequisites

* A [Dynamic](https://app.dynamic.xyz) environment with Fireblocks Flow enabled
* An environment API token (`dyn_...`) from **Developer > API Tokens** in the dashboard
* A connected wallet that can sign transactions on the chains you support. If your app doesn't already handle wallet connection, use the [Dynamic JavaScript SDK](/javascript/reference/quickstart) to connect a wallet and sign
* Node.js 18+ (or any runtime with `fetch`)

## Base URL

```
https://app.dynamicauth.com/api/v0
```

## Overview

The checkout flow is a state machine with eight sequential steps. The same eight steps are used in **payment**, **deposit**, and **withdrawal** flows — only the checkout config (Step 1), how the amount is interpreted (Step 2), and who acts as source vs destination change between them. This guide walks through all three flows end-to-end:

```
1. Create checkout      (defines where funds go — reuse one or create more as your model needs)
2. Create transaction   (initiates a payment or deposit, returns a session token)
3. Attach source        (declare which wallet/chain the sender is paying from)
4. Get quote            (get swap route, fees, and estimated time)
5. Prepare signing      (lock in the quote, get the signing payload)
6. Sign and broadcast   (sender's wallet signs and submits to the network)
7. Notify backend       (report the tx hash so Dynamic can watch the chain)
8. Wait for settlement  (poll or receive webhooks until funds land)
```

Each call advances the state — calling endpoints out of order returns `409`.

Jump to the flow that matches your use case:

* [Payment flow](#payment-flow) — receiver fixes the amount
* [Deposit flow](#deposit-flow) — sender chooses the amount
* [Withdrawal flow](#withdrawal-flow) — platform sends funds to an end-user wallet (API only)

## Authentication

| Context                                                           | Header                                      |
| :---------------------------------------------------------------- | :------------------------------------------ |
| Checkout management (create/update/delete)                        | `Authorization: Bearer dyn_...`             |
| Transaction creation                                              | None required (JWT optional)                |
| Transaction mutations (source, quote, prepare, broadcast, cancel) | `x-dynamic-checkout-session-token: dct_...` |
| Transaction reads (polling)                                       | None required                               |

The session token is returned **once** when you create a transaction. Store it for the duration of the flow.

***

## Choose Your Flow

This guide covers three use cases. The eight steps are the same in each — what changes is the checkout config you create in Step 1, how the amount is interpreted in Step 2, and which wallet is source vs destination. Pick the flow that matches your use case:

* **[Payment flow](#payment-flow)** — `mode: "payment"`. The **receiver** fixes the amount on each transaction (e.g., a \$25 invoice). Use for invoices, e-commerce checkouts, or paid services.
* **[Deposit flow](#deposit-flow)** — `mode: "deposit"`. The **sender** chooses how much to send (e.g., a \$100 top-up). Use for funding flows, on-ramps, or open-ended deposits.
* **[Withdrawal flow](#withdrawal-flow)** — `mode: "deposit"` with source and destination reversed. Your platform fixes the payout amount and signs from a treasury or vault; the end user receives funds at an address you pass per transaction. **HTTP API only** — not available through the JavaScript SDK.

Each flow below is self-contained and walks through all eight steps end-to-end (the withdrawal flow references the deposit flow for shared steps).

### Shared concepts

These apply to both flows:

| Concept                          | Description                                                                        |
| :------------------------------- | :--------------------------------------------------------------------------------- |
| `settlementConfig.strategy`      | How the best quote is selected: `"cheapest"`, `"fastest"`, or `"preferred_order"`  |
| `settlementConfig.settlements`   | Token/chain pairs you want to receive. Each needs a matching destination           |
| `destinationConfig.destinations` | Wallet addresses where funds land. `chainName` must match a settlement entry       |
| `enableOrchestration`            | Optional. Default `true`. When `false`, skips cross-chain settlement orchestration |

| Strategy            | Behavior                                                              |
| :------------------ | :-------------------------------------------------------------------- |
| `"cheapest"`        | Selects the route with the lowest total cost (gas + fees)             |
| `"fastest"`         | Selects the route with the fewest steps                               |
| `"preferred_order"` | Returns the first available quote in the order settlements are listed |

Manage existing checkouts with `GET`, `PATCH`, and `DELETE` on `/environments/{environmentId}/checkouts/{checkoutId}`.

***

## Payment Flow

A complete walkthrough for `mode: "payment"` checkouts, where the **receiver** fixes the amount the sender must pay.

### Step 1 (Payment): Create a Payment Checkout

A checkout is a reusable payment configuration: it defines what token(s) you want to receive and the destination wallet(s). Reuse the same `checkoutId` for every transaction when that configuration does not change.

```
POST /environments/{environmentId}/checkouts
Authorization: Bearer dyn_your_api_token
Content-Type: application/json
```

```json theme={"system"}
{
  "mode": "payment",
  "settlementConfig": {
    "strategy": "cheapest",
    "settlements": [
      {
        "chainName": "EVM",
        "chainId": "8453",
        "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "symbol": "USDC",
        "tokenDecimals": 6
      },
      {
        "chainName": "SOL",
        "chainId": "101",
        "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "symbol": "USDC",
        "tokenDecimals": 6
      }
    ]
  },
  "destinationConfig": {
    "destinations": [
      {
        "chainName": "EVM",
        "type": "address",
        "identifier": "0xYourEVMDestinationWallet"
      },
      {
        "chainName": "SOL",
        "type": "address",
        "identifier": "YourSOLDestinationWallet"
      }
    ]
  }
}
```

**Response (201):** Returns the checkout object with an `id`. Save the `id` — you'll use it as `checkoutId` in Step 2.

### Step 2 (Payment): Create a Transaction

Start a new payment with the amount the receiver wants to collect. This returns a session token that authenticates all subsequent calls.

```
POST /sdk/{environmentId}/checkouts/{checkoutId}/transactions
Content-Type: application/json
```

```json theme={"system"}
{
  "amount": "25.00",
  "currency": "USD",
  "memo": {
    "orderId": "order_abc123"
  }
}
```

| Field                  | Description                                                                                                               |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `amount`               | The amount the receiver collects, as a string (e.g., `"25.00"`)                                                           |
| `currency`             | Fiat currency code the amount is denominated in (e.g., `"USD"`)                                                           |
| `memo`                 | Optional. Arbitrary JSON metadata for your own correlation                                                                |
| `expiresIn`            | Optional. TTL in seconds. Default: `3600` (1 hour)                                                                        |
| `destinationAddresses` | Optional. Override the checkout's destination for this transaction. Required for [per-user withdrawals](#withdrawal-flow) |

**Response (201):**

```json theme={"system"}
{
  "sessionToken": "dct_a1b2c3d4e5f6...",
  "sessionExpiresAt": "2025-03-23T11:00:00Z",
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "checkoutId": "660f9500-f39c-51e5-b827-557766551111",
    "amount": "25.00",
    "currency": "USD",
    "executionState": "initiated",
    "settlementState": "none",
    "riskState": "unknown",
    "quoteVersion": 0
  }
}
```

<Warning>
  Store `sessionToken` and `transaction.id` immediately. The session token is returned **once** and cannot be retrieved again.
</Warning>

### Step 3 (Payment): Attach Source

Declare which wallet and chain the payer is paying from. After this, risk screening runs asynchronously.

```
POST /sdk/{environmentId}/transactions/{transactionId}/source
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "sourceType": "wallet",
  "fromAddress": "0xYourWalletAddress",
  "fromChainId": "8453",
  "fromChainName": "EVM"
}
```

| Field           | Description                                                                    |
| :-------------- | :----------------------------------------------------------------------------- |
| `sourceType`    | `"wallet"` or `"exchange"`                                                     |
| `fromAddress`   | Source wallet address. Required for `wallet` type                              |
| `fromChainId`   | Chain ID (e.g., `"1"` = Ethereum, `"8453"` = Base). Required for `wallet` type |
| `fromChainName` | Chain family: `"EVM"`, `"SOL"`, `"BTC"`, `"SUI"`. Required for `wallet` type   |

For a Solana payer, use the Solana chain values and address format:

```json theme={"system"}
{
  "sourceType": "wallet",
  "fromAddress": "YourSolanaWalletAddress",
  "fromChainId": "101",
  "fromChainName": "SOL"
}
```

**Response (200):** Transaction with `executionState: "source_attached"`.

**Error (403):** Blocked by sanctions screening — cancel and retry with a different source.

### Step 4 (Payment): Get a Quote

Specify which token the sender is paying with. The API finds the best route to your checkout's settlement token(s) for the receiver's requested amount.

```
POST /sdk/{environmentId}/transactions/{transactionId}/quote
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "fromTokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
}
```

| Field              | Description                                                                                                                                                                 |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fromTokenAddress` | Token contract address (EVM) or mint (Solana). Use `0x0000000000000000000000000000000000000000` for EVM native tokens, or `11111111111111111111111111111111` for native SOL |
| `slippage`         | Optional. Slippage tolerance as a decimal (e.g., `0.005` for 0.5%)                                                                                                          |

**Response (200):**

```json theme={"system"}
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "executionState": "quoted",
  "quoteVersion": 1,
  "quote": {
    "version": 1,
    "fromAmount": "25.50",
    "toAmount": "25.00",
    "estimatedTimeSec": 120,
    "fees": {
      "totalFeeUsd": "0.50",
      "gasEstimate": {
        "usdValue": "0.30",
        "nativeValue": "0.00012",
        "nativeSymbol": "ETH"
      }
    },
    "createdAt": "2025-03-23T10:01:00Z",
    "expiresAt": "2025-03-23T10:02:00Z"
  }
}
```

In payment mode, `toAmount` matches the receiver's requested amount and `fromAmount` is what the sender must pay (including swap costs and fees).

<Note>
  Quotes expire in **60 seconds**. If it expires before you call `/prepare`, request a new quote. The `quoteVersion` increments with each new quote.
</Note>

For same-chain, same-token payments (no swap needed), the API builds a direct transfer payload — no routing required.

### Step 5 (Payment): Prepare Signing

Locks in the quote and returns the signing payload. You can optionally request on-chain balance assertions.

```
POST /sdk/{environmentId}/transactions/{transactionId}/prepare
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "assertBalanceForGasCost": true,
  "assertBalanceForTransferAmount": true
}
```

| Field                            | Default | Description                                                                  |
| :------------------------------- | :------ | :--------------------------------------------------------------------------- |
| `assertBalanceForGasCost`        | `false` | Verify the wallet has enough for gas. Returns `422` if insufficient          |
| `assertBalanceForTransferAmount` | `false` | Verify the wallet has enough for the transfer. Returns `422` if insufficient |

**Response (200):** Transaction with `executionState: "signing"` and `quote.signingPayload`:

```json theme={"system"}
{
  "executionState": "signing",
  "quote": {
    "signingPayload": {
      "chainName": "EVM",
      "chainId": "8453",
      "evmTransaction": {
        "to": "0xContractAddress",
        "data": "0xCalldata...",
        "value": "0x0",
        "gasLimit": "0x5208"
      },
      "evmApproval": {
        "tokenAddress": "0xTokenAddress",
        "spenderAddress": "0xSpenderAddress",
        "amount": "25500000"
      }
    }
  }
}
```

The payload structure depends on the chain:

| Chain        | Fields                                                     | Notes                                 |
| :----------- | :--------------------------------------------------------- | :------------------------------------ |
| EVM          | `evmTransaction` (`to`, `data`, `value`, `gasLimit`)       | Standard EVM transaction              |
| EVM (ERC-20) | `evmApproval` (`tokenAddress`, `spenderAddress`, `amount`) | Send approval tx first if present     |
| SOL, SUI     | `serializedTransaction`                                    | Base64-encoded serialized transaction |
| BTC          | `psbt`                                                     | Base64-encoded unsigned PSBT          |

**Possible errors:**

* `422` — Quote expired: go back to Step 4
* `422` — Risk not cleared: poll `GET /transactions/{id}` until `riskState` is `"cleared"`, then retry
* `422` — Insufficient balance: response includes `required` and `available` amounts

### Step 6 (Payment): Sign and Broadcast On-Chain

Use `prepared.quote.signingPayload` to sign and submit the transaction with whatever wallet your sender has connected. The payload — and the code to sign it — depends on the source chain. See [Signing the transaction by chain](#signing-the-transaction-by-chain) for EVM, Solana, Sui, and Bitcoin examples. It returns a `txHash` you'll report in Step 7.

### Step 7 (Payment): Notify Backend of Broadcast

<Note>
  This endpoint **does not broadcast the transaction on-chain.** That already happened in Step 6 — when the wallet signed and submitted the transaction, the network received it. This call is your client notifying Dynamic's backend that the broadcast happened and handing over the resulting `txHash`, so the backend can start watching the chain for confirmation and orchestrating settlement.
</Note>

Report the transaction hash back to the API once your wallet returns it.

```
POST /sdk/{environmentId}/transactions/{transactionId}/broadcast
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "txHash": "0xabc123def456..."
}
```

**Response (200):** Transaction with `executionState: "broadcasted"`.

<Warning>
  **Point of no return.** After this call, the transaction cannot be cancelled. The backend begins monitoring the blockchain and orchestrating settlement.
</Warning>

### Step 8 (Payment): Wait for Settlement

After broadcast, the backend handles cross-chain settlement automatically. Monitor progress via polling or webhooks.

#### Option A: Polling

```
GET /sdk/{environmentId}/transactions/{transactionId}
```

No authentication required. Poll every 3 seconds.

**Stop when you see a terminal state:**

| Condition                         | Meaning                                       |
| :-------------------------------- | :-------------------------------------------- |
| `settlementState === "completed"` | Funds delivered to the receiver's destination |
| `settlementState === "failed"`    | Settlement failed                             |
| `executionState === "failed"`     | Execution failed                              |
| `executionState === "cancelled"`  | Transaction cancelled                         |
| `executionState === "expired"`    | Session timed out                             |

Settlement progresses through: `none` → `routing` → `bridging` → `swapping` → `settling` → `completed`. Same-chain, same-token payments jump directly to `completed`.

#### Option B: Webhooks (Recommended)

Set up a webhook to receive events as the transaction progresses:

```
POST /environments/{environmentId}/webhooks
Authorization: Bearer dyn_your_api_token
Content-Type: application/json
```

```json theme={"system"}
{
  "url": "https://your-api.example.com/webhooks/checkout",
  "events": [
    "execution.state.broadcasted",
    "execution.state.source_confirmed",
    "settlement.state.completed",
    "execution.state.failed",
    "settlement.state.failed"
  ],
  "isEnabled": true
}
```

**Key events to handle:**

| Event                        | Action                                     |
| :--------------------------- | :----------------------------------------- |
| `settlement.state.completed` | Payment is done — fulfill the order        |
| `settlement.state.failed`    | Settlement failed — inspect `data.failure` |
| `execution.state.failed`     | Execution failed — inspect `data.failure`  |

```typescript title="webhook-handler.ts" theme={"system"}
import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhooks/checkout', (req, res) => {
  const { eventName, data } = req.body;

  switch (eventName) {
    case 'settlement.state.completed':
      fulfillOrder(data.transactionId);
      break;
    case 'execution.state.failed':
    case 'settlement.state.failed':
      handleFailure(data.transactionId, data.failure);
      break;
  }

  // Respond quickly — process async
  res.sendStatus(200);
});
```

***

## Deposit Flow

A complete walkthrough for `mode: "deposit"` checkouts, where the **sender** chooses how much to send. The eight steps mirror the payment flow — what changes is the checkout `mode` and how the amount is interpreted.

### Step 1 (Deposit): Create a Deposit Checkout

A checkout is a reusable deposit configuration: it defines what token(s) you'll receive and the destination wallet(s). Reuse the same `checkoutId` for every deposit when that configuration does not change.

```
POST /environments/{environmentId}/checkouts
Authorization: Bearer dyn_your_api_token
Content-Type: application/json
```

```json theme={"system"}
{
  "mode": "deposit",
  "settlementConfig": {
    "strategy": "cheapest",
    "settlements": [
      {
        "chainName": "EVM",
        "chainId": "8453",
        "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "symbol": "USDC",
        "tokenDecimals": 6
      },
      {
        "chainName": "SOL",
        "chainId": "101",
        "tokenAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "symbol": "USDC",
        "tokenDecimals": 6
      }
    ]
  },
  "destinationConfig": {
    "destinations": [
      {
        "chainName": "EVM",
        "type": "address",
        "identifier": "0xYourEVMDestinationWallet"
      },
      {
        "chainName": "SOL",
        "type": "address",
        "identifier": "YourSOLDestinationWallet"
      }
    ]
  }
}
```

The only structural difference from a payment checkout is `"mode": "deposit"`. Settlement and destination configs work the same way.

**Response (201):** Returns the checkout object with an `id`. Save the `id` — you'll use it as `checkoutId` in Step 2.

### Step 2 (Deposit): Create a Transaction

Start a new deposit. In deposit mode the sender chooses how much they want to send — for example, an end user topping up a \$100 balance. This returns a session token that authenticates all subsequent calls.

```
POST /sdk/{environmentId}/checkouts/{checkoutId}/transactions
Content-Type: application/json
```

```json theme={"system"}
{
  "amount": "100.00",
  "currency": "USD",
  "memo": {
    "userId": "user_abc123",
    "purpose": "account_top_up"
  }
}
```

| Field                  | Description                                                                                                               |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `amount`               | The amount the sender wants to deposit, as a string (e.g., `"100.00"`)                                                    |
| `currency`             | Currency code the amount is denominated in (e.g., `"USD"`)                                                                |
| `memo`                 | Optional. Arbitrary JSON metadata for your own correlation (e.g., user ID)                                                |
| `expiresIn`            | Optional. TTL in seconds. Default: `3600` (1 hour)                                                                        |
| `destinationAddresses` | Optional. Override the checkout's destination for this transaction. Required for [per-user withdrawals](#withdrawal-flow) |

**Response (201):**

```json theme={"system"}
{
  "sessionToken": "dct_a1b2c3d4e5f6...",
  "sessionExpiresAt": "2025-03-23T11:00:00Z",
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "checkoutId": "660f9500-f39c-51e5-b827-557766551111",
    "amount": "100.00",
    "currency": "USD",
    "executionState": "initiated",
    "settlementState": "none",
    "riskState": "unknown",
    "quoteVersion": 0
  }
}
```

<Warning>
  Store `sessionToken` and `transaction.id` immediately. The session token is returned **once** and cannot be retrieved again.
</Warning>

### Step 3 (Deposit): Attach Source

Declare which wallet and chain the depositor is funding from. After this, risk screening runs asynchronously.

```
POST /sdk/{environmentId}/transactions/{transactionId}/source
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "sourceType": "wallet",
  "fromAddress": "0xYourWalletAddress",
  "fromChainId": "8453",
  "fromChainName": "EVM"
}
```

| Field           | Description                                                                    |
| :-------------- | :----------------------------------------------------------------------------- |
| `sourceType`    | `"wallet"` or `"exchange"`                                                     |
| `fromAddress`   | Depositor's wallet address. Required for `wallet` type                         |
| `fromChainId`   | Chain ID (e.g., `"1"` = Ethereum, `"8453"` = Base). Required for `wallet` type |
| `fromChainName` | Chain family: `"EVM"`, `"SOL"`, `"BTC"`, `"SUI"`. Required for `wallet` type   |

For a Solana depositor, use the Solana chain values and address format:

```json theme={"system"}
{
  "sourceType": "wallet",
  "fromAddress": "YourSolanaWalletAddress",
  "fromChainId": "101",
  "fromChainName": "SOL"
}
```

**Response (200):** Transaction with `executionState: "source_attached"`.

**Error (403):** Blocked by sanctions screening — cancel and retry with a different source.

### Step 4 (Deposit): Get a Quote

Specify which token the depositor is funding with. The API finds the best route from that token to your checkout's settlement token(s) for the deposit amount.

```
POST /sdk/{environmentId}/transactions/{transactionId}/quote
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "fromTokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
}
```

| Field              | Description                                                                                                                                                                                          |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fromTokenAddress` | Token contract address (EVM) or mint (Solana) the depositor is sending. Use `0x0000000000000000000000000000000000000000` for EVM native tokens, or `11111111111111111111111111111111` for native SOL |
| `slippage`         | Optional. Slippage tolerance as a decimal (e.g., `0.005` for 0.5%)                                                                                                                                   |

**Response (200):**

```json theme={"system"}
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "executionState": "quoted",
  "quoteVersion": 1,
  "quote": {
    "version": 1,
    "fromAmount": "100.50",
    "toAmount": "100.00",
    "estimatedTimeSec": 120,
    "fees": {
      "totalFeeUsd": "0.50",
      "gasEstimate": {
        "usdValue": "0.30",
        "nativeValue": "0.00012",
        "nativeSymbol": "ETH"
      }
    },
    "createdAt": "2025-03-23T10:01:00Z",
    "expiresAt": "2025-03-23T10:02:00Z"
  }
}
```

`fromAmount` is what the depositor's wallet will be charged in the source token; `toAmount` is what lands at the destination after swap and fees.

<Note>
  Quotes expire in **60 seconds**. If it expires before you call `/prepare`, request a new quote. The `quoteVersion` increments with each new quote.
</Note>

For same-chain, same-token deposits (no swap needed), the API builds a direct transfer payload — no routing required.

### Step 5 (Deposit): Prepare Signing

Locks in the quote and returns the signing payload. You can optionally request on-chain balance assertions.

```
POST /sdk/{environmentId}/transactions/{transactionId}/prepare
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "assertBalanceForGasCost": true,
  "assertBalanceForTransferAmount": true
}
```

| Field                            | Default | Description                                                                  |
| :------------------------------- | :------ | :--------------------------------------------------------------------------- |
| `assertBalanceForGasCost`        | `false` | Verify the wallet has enough for gas. Returns `422` if insufficient          |
| `assertBalanceForTransferAmount` | `false` | Verify the wallet has enough for the transfer. Returns `422` if insufficient |

**Response (200):** Transaction with `executionState: "signing"` and `quote.signingPayload`:

```json theme={"system"}
{
  "executionState": "signing",
  "quote": {
    "signingPayload": {
      "chainName": "EVM",
      "chainId": "8453",
      "evmTransaction": {
        "to": "0xContractAddress",
        "data": "0xCalldata...",
        "value": "0x0",
        "gasLimit": "0x5208"
      },
      "evmApproval": {
        "tokenAddress": "0xTokenAddress",
        "spenderAddress": "0xSpenderAddress",
        "amount": "100500000"
      }
    }
  }
}
```

The payload structure depends on the chain:

| Chain        | Fields                                                     | Notes                                 |
| :----------- | :--------------------------------------------------------- | :------------------------------------ |
| EVM          | `evmTransaction` (`to`, `data`, `value`, `gasLimit`)       | Standard EVM transaction              |
| EVM (ERC-20) | `evmApproval` (`tokenAddress`, `spenderAddress`, `amount`) | Send approval tx first if present     |
| SOL, SUI     | `serializedTransaction`                                    | Base64-encoded serialized transaction |
| BTC          | `psbt`                                                     | Base64-encoded unsigned PSBT          |

**Possible errors:**

* `422` — Quote expired: go back to Step 4
* `422` — Risk not cleared: poll `GET /transactions/{id}` until `riskState` is `"cleared"`, then retry
* `422` — Insufficient balance: response includes `required` and `available` amounts

### Step 6 (Deposit): Sign and Broadcast On-Chain

Use `prepared.quote.signingPayload` to sign and submit the transaction with whatever wallet the depositor has connected. The payload — and the code to sign it — depends on the source chain. See [Signing the transaction by chain](#signing-the-transaction-by-chain) for EVM, Solana, Sui, and Bitcoin examples. It returns a `txHash` you'll report in Step 7.

### Step 7 (Deposit): Notify Backend of Broadcast

<Note>
  This endpoint **does not broadcast the transaction on-chain.** That already happened in Step 6 — when the wallet signed and submitted the transaction, the network received it. This call is your client notifying Dynamic's backend that the broadcast happened and handing over the resulting `txHash`, so the backend can start watching the chain for confirmation and orchestrating settlement.
</Note>

Report the transaction hash back to the API once your wallet returns it.

```
POST /sdk/{environmentId}/transactions/{transactionId}/broadcast
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "txHash": "0xabc123def456..."
}
```

**Response (200):** Transaction with `executionState: "broadcasted"`.

<Warning>
  **Point of no return.** After this call, the transaction cannot be cancelled. The backend begins monitoring the blockchain and orchestrating settlement.
</Warning>

### Step 8 (Deposit): Wait for Settlement

After broadcast, the backend handles cross-chain settlement automatically. Monitor progress via polling or webhooks.

#### Option A: Polling

```
GET /sdk/{environmentId}/transactions/{transactionId}
```

No authentication required. Poll every 3 seconds.

**Stop when you see a terminal state:**

| Condition                         | Meaning                              |
| :-------------------------------- | :----------------------------------- |
| `settlementState === "completed"` | Deposit delivered to the destination |
| `settlementState === "failed"`    | Settlement failed                    |
| `executionState === "failed"`     | Execution failed                     |
| `executionState === "cancelled"`  | Transaction cancelled                |
| `executionState === "expired"`    | Session timed out                    |

Settlement progresses through: `none` → `routing` → `bridging` → `swapping` → `settling` → `completed`. Same-chain, same-token deposits jump directly to `completed`.

#### Option B: Webhooks (Recommended)

Set up a webhook to receive events as the transaction progresses:

```
POST /environments/{environmentId}/webhooks
Authorization: Bearer dyn_your_api_token
Content-Type: application/json
```

```json theme={"system"}
{
  "url": "https://your-api.example.com/webhooks/checkout",
  "events": [
    "execution.state.broadcasted",
    "execution.state.source_confirmed",
    "settlement.state.completed",
    "execution.state.failed",
    "settlement.state.failed"
  ],
  "isEnabled": true
}
```

**Key events to handle:**

| Event                        | Action                                      |
| :--------------------------- | :------------------------------------------ |
| `settlement.state.completed` | Deposit is done — credit the user's account |
| `settlement.state.failed`    | Settlement failed — inspect `data.failure`  |
| `execution.state.failed`     | Execution failed — inspect `data.failure`   |

```typescript title="webhook-handler.ts" theme={"system"}
import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhooks/checkout', (req, res) => {
  const { eventName, data } = req.body;

  switch (eventName) {
    case 'settlement.state.completed':
      creditUserAccount(data.transactionId);
      break;
    case 'execution.state.failed':
    case 'settlement.state.failed':
      handleFailure(data.transactionId, data.failure);
      break;
  }

  // Respond quickly — process async
  res.sendStatus(200);
});
```

***

## Withdrawal Flow

<Info>
  Withdrawals and money-out are supported through this HTTP API only. The [Fireblocks Flow JavaScript SDK guide](/overview/fireblocks-flow-js-sdk) covers payment and deposit checkouts, not platform-to-user payouts.
</Info>

A withdrawal sends funds **from** your treasury, vault, or [server wallet](/overview/wallets/overview) **to** an end-user wallet, optionally converting across chains and tokens along the way. It uses the same eight steps as the [deposit flow](#deposit-flow), with `mode: "deposit"` and reversed roles:

| Role                | Deposit (money in)               | Withdrawal (money out)                     |
| :------------------ | :------------------------------- | :----------------------------------------- |
| Source              | End user's wallet or exchange    | Your treasury, vault, or server wallet     |
| Destination         | Your merchant or treasury wallet | End user's wallet (`destinationAddresses`) |
| Amount              | Sender chooses                   | Your platform chooses                      |
| Signing (Steps 5–6) | End user's connected wallet      | Your custody or server wallet              |

For per-user payouts from one shared treasury, create a single withdrawal checkout and pass each user's wallet in `destinationAddresses` when you create the transaction. See [Money in and money out](/overview/fireblocks-flow#money-in-and-money-out) on the overview for the product model.

<Warning>
  Your application must sign Steps 5–6 with a wallet you control (Fireblocks vault, server wallet, or similar). End users do not sign withdrawal transactions in their browser the way they do for deposits.
</Warning>

### Step 1 (Withdrawal): Create a Withdrawal Checkout

Create a `mode: "deposit"` checkout that defines the token(s) and chain(s) the user should **receive**. Reuse the same `checkoutId` for every withdrawal when settlement options do not change.

```
POST /environments/{environmentId}/checkouts
Authorization: Bearer dyn_your_api_token
Content-Type: application/json
```

```json theme={"system"}
{
  "mode": "deposit",
  "settlementConfig": {
    "strategy": "cheapest",
    "settlements": [
      {
        "chainName": "EVM",
        "chainId": "1",
        "tokenAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "symbol": "USDC",
        "tokenDecimals": 6
      }
    ]
  },
  "destinationConfig": {
    "destinations": [
      {
        "chainName": "EVM",
        "type": "address",
        "identifier": "0xYourTreasuryOrVaultAddress"
      }
    ]
  }
}
```

`destinationConfig` must align with your `settlementConfig` entries. Per-transaction user destinations are set in Step 2 via `destinationAddresses`.

**Response (201):** Save the checkout `id` as `checkoutId` for Step 2.

### Step 2 (Withdrawal): Create a Transaction

Start a payout with the amount your platform sends and the end user's destination. `destinationAddresses` overrides the checkout destination for this transaction — required for per-user withdrawals.

```
POST /sdk/{environmentId}/checkouts/{checkoutId}/transactions
Content-Type: application/json
```

```json theme={"system"}
{
  "amount": "100.00",
  "currency": "USD",
  "memo": {
    "withdrawalId": "wd_abc123",
    "userId": "user_456"
  },
  "destinationAddresses": [
    {
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f7aBCD",
      "chain": "EVM"
    }
  ]
}
```

| Field                  | Description                                                                                                                   |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `amount`               | The payout amount your platform sends, as a string (e.g., `"100.00"`)                                                         |
| `currency`             | Fiat currency code the amount is denominated in (e.g., `"USD"`)                                                               |
| `destinationAddresses` | End-user wallet(s) that receive settled funds. Each entry needs `address` and `chain` (`"EVM"`, `"SOL"`, `"BTC"`, or `"SUI"`) |
| `memo`                 | Optional. Arbitrary JSON metadata (e.g., withdrawal or user ID)                                                               |
| `expiresIn`            | Optional. TTL in seconds. Default: `3600` (1 hour)                                                                            |

**Response (201):** Same shape as the [deposit flow Step 2](#step-2-deposit-create-a-transaction). Store `sessionToken` and `transaction.id` immediately.

### Step 3 (Withdrawal): Attach Source

Attach your treasury, vault, or server wallet as the funding source — not the end user's wallet.

```
POST /sdk/{environmentId}/transactions/{transactionId}/source
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "sourceType": "wallet",
  "fromAddress": "0xYourTreasuryOrVaultAddress",
  "fromChainId": "8453",
  "fromChainName": "EVM"
}
```

Use the chain and token your treasury holds (e.g., USDC on Base). The quote step routes from this source to the settlement token and `destinationAddresses` you set in Step 2.

**Response (200):** Transaction with `executionState: "source_attached"`.

**Error (403):** Blocked by sanctions screening — cancel and retry with a different source.

### Steps 4–8 (Withdrawal): Quote Through Settlement

Steps 4–8 use the same endpoints as the deposit flow. Differences are **who signs** and **what you do on completion**:

| Step                   | Deposit flow reference                                          | Withdrawal notes                                                              |
| :--------------------- | :-------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| 4. Get quote           | [Step 4 (Deposit)](#step-4-deposit-get-a-quote)                 | Pass the token your treasury pays with in `fromTokenAddress`                  |
| 5. Prepare             | [Step 5 (Deposit)](#step-5-deposit-prepare-signing)             | Balance assertions apply to your treasury wallet                              |
| 6. Sign and broadcast  | [Step 6 (Deposit)](#step-6-deposit-sign-and-broadcast-on-chain) | Sign with your custody or server wallet, not the end user's browser wallet    |
| 7. Notify backend      | [Step 7 (Deposit)](#step-7-deposit-notify-backend-of-broadcast) | Report the `txHash` after your platform broadcasts                            |
| 8. Wait for settlement | [Step 8 (Deposit)](#step-8-deposit-wait-for-settlement)         | On `settlement.state.completed`, mark the withdrawal fulfilled in your system |

**Example — Step 4 quote** (treasury pays with USDC on Base; user receives USDC on Ethereum):

```
POST /sdk/{environmentId}/transactions/{transactionId}/quote
x-dynamic-checkout-session-token: dct_...
Content-Type: application/json
```

```json theme={"system"}
{
  "fromTokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
}
```

On completion, `settlementState === "completed"` means funds reached the `destinationAddresses` from Step 2. Handle `settlement.state.completed` webhooks the same way as in [Step 8 (Deposit)](#step-8-deposit-wait-for-settlement), but credit the user's balance or close the withdrawal request instead of treating it as an inbound deposit.

***

## Signing the Transaction by Chain

Step 6 of every flow signs and broadcasts `prepared.quote.signingPayload`, then reports the resulting `txHash` in Step 7. The flow itself is identical across chains — only this signing step differs. The payload field depends on the source chain:

| Chain   | Payload field                                 | Sign with                                                           |
| :------ | :-------------------------------------------- | :------------------------------------------------------------------ |
| EVM     | `evmTransaction` (+ optional `evmApproval`)   | [viem](https://viem.sh), wagmi, ethers, or Dynamic's primary wallet |
| Solana  | `serializedTransaction` (base64 versioned tx) | [`@solana/web3.js`](https://solana.com/docs/clients/javascript)     |
| Sui     | `serializedTransaction` (base64)              | [`@mysten/sui`](https://sdk.mystenlabs.com/typescript)              |
| Bitcoin | `psbt` (base64 unsigned PSBT)                 | any PSBT signer (e.g. `bitcoinjs-lib`)                              |

<Note>
  **Don't want to manage signing yourself?** Use the [Dynamic JavaScript SDK](/overview/fireblocks-flow-js-sdk) — `submitCheckoutTransaction` prepares, signs, and broadcasts across every supported chain from a connected wallet account, so you skip this step entirely.
</Note>

In each example, `prepared` is the response from Step 5.

### EVM

Uses an already-connected EVM wallet client (`walletClient`) — for example the one returned by `useWalletClient()` in wagmi or by Dynamic's primary wallet connector. If `evmApproval` is present, send the approval transaction first, then the main one.

```typescript title="sign-evm.ts" theme={"system"}
import { parseAbi } from 'viem';

const { signingPayload } = prepared.quote;

// Handle ERC-20 approval if needed
if (signingPayload.evmApproval) {
  const { tokenAddress, spenderAddress, amount } = signingPayload.evmApproval;
  const approvalHash = await walletClient.writeContract({
    address: tokenAddress as `0x${string}`,
    abi: parseAbi(['function approve(address, uint256) returns (bool)']),
    functionName: 'approve',
    args: [spenderAddress as `0x${string}`, BigInt(amount)],
  });
  await walletClient.waitForTransactionReceipt({ hash: approvalHash });
}

// Send the main transaction
const txHash = await walletClient.sendTransaction({
  to: signingPayload.evmTransaction.to as `0x${string}`,
  data: signingPayload.evmTransaction.data as `0x${string}`,
  value: BigInt(signingPayload.evmTransaction.value),
});
```

### Solana

`serializedTransaction` is a base64-encoded [versioned transaction](https://solana.com/docs/core/transactions/versions) — there are no approvals. Deserialize it, sign with your connected wallet (or keypair), and broadcast. The example below uses [`@solana/web3.js`](https://solana.com/docs/clients/javascript).

```typescript title="sign-solana.ts" theme={"system"}
import {
  Connection,
  Keypair,
  VersionedTransaction,
} from '@solana/web3.js';

const connection = new Connection(
  process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
  'confirmed'
);
const signer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.SOLANA_SECRET_KEY as string))
);

const tx = VersionedTransaction.deserialize(
  Buffer.from(prepared.quote.signingPayload.serializedTransaction, 'base64')
);
tx.sign([signer]);

const txHash = await connection.sendRawTransaction(tx.serialize());
await connection.confirmTransaction(txHash, 'confirmed');
```

<Note>
  Using Dynamic [server wallets](/overview/wallets/overview) (MPC)? Sign the same `VersionedTransaction` with `DynamicSvmWalletClient.signTransaction`, attach the returned signature, then broadcast — no raw private key required. Report the resulting signature as `txHash` in Step 7.
</Note>

### Sui

Sui returns the same `serializedTransaction` field as Solana — a base64-encoded transaction. Deserialize and sign it with your Sui keypair via [`@mysten/sui`](https://sdk.mystenlabs.com/typescript), then report the resulting digest as `txHash`.

### Bitcoin

Bitcoin returns a `psbt` field — a base64-encoded unsigned [PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki). Sign each input with your wallet, finalize, extract the raw transaction, broadcast it, and report the resulting txid as `txHash`.

***

## Cancelling a Transaction

Cancel any time before broadcast (states: `initiated`, `source_attached`, `quoted`, `signing`):

```
POST /sdk/{environmentId}/transactions/{transactionId}/cancel
x-dynamic-checkout-session-token: dct_...
```

Returns the transaction with `executionState: "cancelled"`. Once cancelled, create a new transaction to retry.

***

## Complete Example

A self-contained TypeScript script that creates a checkout, executes a payment, and polls for settlement. It assumes you already have a connected wallet client — for example one returned by Dynamic's JS SDK, wagmi's `useWalletClient()`, or any viem `WalletClient`. If your app doesn't have wallet connection yet, use the [Dynamic JavaScript SDK](/javascript/reference/quickstart) to provide it.

<Note>
  This example pays from an **EVM** wallet. To pay from **Solana**, keep Steps 2–5 and 7–8 identical — only swap the Step 6 signing block for the Solana variant ([sign-solana.ts](#solana)), attach a Solana source (`fromChainName: "SOL"`, `fromChainId: "101"`), and quote with a Solana `fromTokenAddress` (mint, or `11111111111111111111111111111111` for native SOL).
</Note>

```typescript title="checkout-example.ts" theme={"system"}
import { parseAbi, type WalletClient } from 'viem';

// --- Config ---
const API = 'https://app.dynamicauth.com/api/v0';
const ENV_ID = 'your-environment-id';
const API_TOKEN = 'dyn_your_api_token';

// Bring your own connected wallet client (viem, wagmi, Dynamic primary wallet, etc.)
declare const walletClient: WalletClient & {
  waitForTransactionReceipt: (args: { hash: `0x${string}` }) => Promise<unknown>;
};
const account = walletClient.account!;

// --- Helpers ---
async function api(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

// --- One-time setup ---
async function createCheckout(): Promise<string> {
  const checkout = await api(`/environments/${ENV_ID}/checkouts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    body: JSON.stringify({
      mode: 'payment',
      settlementConfig: {
        strategy: 'cheapest',
        settlements: [
          {
            chainName: 'EVM',
            chainId: '8453',
            symbol: 'USDC',
            tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            tokenDecimals: 6,
          },
        ],
      },
      destinationConfig: {
        destinations: [
          {
            chainName: 'EVM',
            type: 'address',
            identifier: '0xYourDestinationWallet',
          },
        ],
      },
    }),
  });
  console.log('Checkout created:', checkout.id);
  return checkout.id;
}

// --- Per-payment flow ---
async function pay(checkoutId: string, amount: string) {
  // Step 2: Create transaction
  const { sessionToken, transaction } = await api(
    `/sdk/${ENV_ID}/checkouts/${checkoutId}/transactions`,
    {
      method: 'POST',
      body: JSON.stringify({
        amount,
        currency: 'USD',
        memo: { orderId: 'order_abc123' },
      }),
    }
  );
  const txId = transaction.id;
  const session = { 'x-dynamic-checkout-session-token': sessionToken };

  // Step 3: Attach source
  await api(`/sdk/${ENV_ID}/transactions/${txId}/source`, {
    method: 'POST',
    headers: session,
    body: JSON.stringify({
      sourceType: 'wallet',
      fromAddress: account.address,
      fromChainId: '8453',
      fromChainName: 'EVM',
    }),
  });

  // Step 4: Get quote (paying with USDC on Base)
  const quoted = await api(`/sdk/${ENV_ID}/transactions/${txId}/quote`, {
    method: 'POST',
    headers: session,
    body: JSON.stringify({
      fromTokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    }),
  });
  console.log(
    `Quote: send ${quoted.quote.fromAmount}, receive ${quoted.quote.toAmount}, fees: $${quoted.quote.fees?.totalFeeUsd}`
  );

  // Step 5: Prepare signing (with balance checks)
  const prepared = await api(`/sdk/${ENV_ID}/transactions/${txId}/prepare`, {
    method: 'POST',
    headers: session,
    body: JSON.stringify({
      assertBalanceForGasCost: true,
      assertBalanceForTransferAmount: true,
    }),
  });

  // Step 6: Sign and broadcast
  const { signingPayload } = prepared.quote;

  if (signingPayload.evmApproval) {
    const approvalHash = await walletClient.writeContract({
      address: signingPayload.evmApproval.tokenAddress as `0x${string}`,
      abi: parseAbi(['function approve(address, uint256) returns (bool)']),
      functionName: 'approve',
      args: [
        signingPayload.evmApproval.spenderAddress as `0x${string}`,
        BigInt(signingPayload.evmApproval.amount),
      ],
    });
    await walletClient.waitForTransactionReceipt({ hash: approvalHash });
    console.log('Token approved');
  }

  const txHash = await walletClient.sendTransaction({
    to: signingPayload.evmTransaction.to as `0x${string}`,
    data: signingPayload.evmTransaction.data as `0x${string}`,
    value: BigInt(signingPayload.evmTransaction.value),
  });
  console.log('Broadcasted:', txHash);

  // Step 7: Record broadcast
  await api(`/sdk/${ENV_ID}/transactions/${txId}/broadcast`, {
    method: 'POST',
    headers: session,
    body: JSON.stringify({ txHash }),
  });

  // Step 8: Poll for settlement
  while (true) {
    const tx = await api(`/sdk/${ENV_ID}/transactions/${txId}`);

    if (tx.settlementState === 'completed') {
      console.log('Payment settled!');
      return tx;
    }

    if (
      tx.settlementState === 'failed' ||
      ['cancelled', 'expired', 'failed'].includes(tx.executionState)
    ) {
      throw new Error(
        `Payment failed: execution=${tx.executionState}, settlement=${tx.settlementState}`
      );
    }

    console.log(
      `Waiting... execution=${tx.executionState}, settlement=${tx.settlementState}`
    );
    await new Promise((r) => setTimeout(r, 3000));
  }
}

// --- Run ---
const checkoutId = await createCheckout();
await pay(checkoutId, '25.00');
```

***

## Supported Chains and Native Tokens

Fireblocks Flow supports the following chains. Use these values for `chainName`, `chainId`, and token addresses in your settlement config and source attachment.

### Chain Reference

| Chain   | `chainName` | `chainId`                                                                                                                             | Networks               |
| :------ | :---------- | :------------------------------------------------------------------------------------------------------------------------------------ | :--------------------- |
| EVM     | `"EVM"`     | Standard EVM chain ID (e.g., `"1"` for Ethereum, `"137"` for Polygon, `"8453"` for Base, `"42161"` for Arbitrum, `"10"` for Optimism) | All major EVM networks |
| Solana  | `"SOL"`     | `"101"`                                                                                                                               | Solana mainnet         |
| Bitcoin | `"BTC"`     | `"1"`                                                                                                                                 | Bitcoin mainnet        |
| Sui     | `"SUI"`     | `"501"`                                                                                                                               | Sui mainnet            |

**Except for the EVM chains listed below, only mainnet is supported:**

| Name                     | `ID`         |
| :----------------------- | :----------- |
| Base Sepolia Testnet     | `"84532"`    |
| Arbitrum Sepolia Testnet | `"421614"`   |
| Arc Testnet              | `"5042002"`  |
| OP Sepolia Testnet       | `"11155420"` |

### Native Token Addresses

For native tokens (ETH, SOL, BTC, SUI), use any of the accepted addresses below in token address fields:

| Chain   | Accepted native token addresses                                                                                    |
| :------ | :----------------------------------------------------------------------------------------------------------------- |
| EVM     | `0x0000000000000000000000000000000000000000` (zero address) or `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`        |
| Solana  | `11111111111111111111111111111111` (System Program) or `So11111111111111111111111111111111111111112` (Wrapped SOL) |
| Bitcoin | `11111111111111111111111111111111` or `bitcoin`                                                                    |
| Sui     | `0x2::sui::SUI` or `0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI`                  |

For non-native tokens, use the token's contract address on that chain (e.g., `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` for USDC on Base).

***

## Error Reference

| Status | Cause                               | Recovery                                              |
| :----- | :---------------------------------- | :---------------------------------------------------- |
| `400`  | Invalid request body                | Check field formats                                   |
| `401`  | Missing or invalid session token    | Verify `x-dynamic-checkout-session-token` header      |
| `403`  | Risk screening blocked              | Cancel and retry with a different source              |
| `404`  | Resource not found                  | Verify checkout/transaction IDs                       |
| `409`  | State conflict or duplicate tx hash | Check `executionState` and call the correct next step |
| `422`  | Quote expired                       | Re-quote (Step 4) and retry prepare                   |
| `422`  | Insufficient balance                | Source wallet doesn't have enough funds               |
| `422`  | Risk not cleared                    | Poll until `riskState` is `"cleared"`, then retry     |

***

## Tips

* **Balance assertions:** Enable both `assertBalanceForGasCost` and `assertBalanceForTransferAmount` in prepare to catch insufficient balance before signing.
* **Quote evaluation:** Check `quote.fees.totalFeeUsd` and `quote.estimatedTimeSec` programmatically before proceeding. Cancel and retry with a different token/chain if fees are too high.
* **Quote expiry:** Quotes last 60 seconds. Sign promptly. You can re-quote multiple times — `quoteVersion` increments with each new quote.
* **Idempotency:** Use the `memo` field to store your own idempotency keys (e.g., `{ "orderId": "order_abc123" }`).
* **Error recovery:** If your process crashes mid-flow, call `GET /transactions/{id}` to check the current `executionState` and resume from the correct step.
* **Session token lifetime:** Matches the transaction's `expiresIn` (default 1 hour).

## Quick Reference

| Step               | Method | Endpoint                                           | Auth          |
| :----------------- | :----- | :------------------------------------------------- | :------------ |
| Create checkout    | `POST` | `/environments/{envId}/checkouts`                  | API token     |
| Create transaction | `POST` | `/sdk/{envId}/checkouts/{checkoutId}/transactions` | None          |
| Attach source      | `POST` | `/sdk/{envId}/transactions/{txId}/source`          | Session token |
| Get quote          | `POST` | `/sdk/{envId}/transactions/{txId}/quote`           | Session token |
| Prepare signing    | `POST` | `/sdk/{envId}/transactions/{txId}/prepare`         | Session token |
| Record broadcast   | `POST` | `/sdk/{envId}/transactions/{txId}/broadcast`       | Session token |
| Cancel             | `POST` | `/sdk/{envId}/transactions/{txId}/cancel`          | Session token |
| Poll status        | `GET`  | `/sdk/{envId}/transactions/{txId}`                 | None          |

## Related

* [Fireblocks Flow overview](/overview/fireblocks-flow) — Product capabilities, modes, withdrawals, and webhooks
* [Token swaps via API](/recipes/integrations/swaps/swap-api) — Standalone token swaps without checkout orchestration
* [Fireblocks Flow JavaScript SDK guide](/overview/fireblocks-flow-js-sdk) — End-to-end checkout with the Dynamic client
* [`createCheckoutTransaction`](/javascript/reference/client/create-checkout-transaction) — SDK transaction creation
* [`submitCheckoutTransaction`](/javascript/reference/client/submit-checkout-transaction) — SDK submit (prepare + sign + broadcast)
