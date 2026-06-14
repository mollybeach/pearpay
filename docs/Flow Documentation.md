> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fireblocks Flow

> Accept crypto deposits from any wallet or exchange. Settle in any token you choose.

<Note>
  This is an enterprise-only feature. Please [contact us](https://www.dynamic.xyz/book-a-call) to enable.
</Note>

Fireblocks Flow lets your users pay from any wallet, exchange, or chain and you receive the token you want, on the chain you want, at the address you want.

## Build with Fireblocks Flow

Integrate with Fireblocks Flow using the JavaScript SDK or raw HTTP. Both paths cover the full payment and deposit flow — pick the one that fits your stack:

<CardGroup cols={2}>
  <Card title="JavaScript SDK" icon="js" href="/overview/fireblocks-flow-js-sdk" />

  <Card title="API only" icon="code" href="/overview/fireblocks-flow-api" />
</CardGroup>

A pre-built UI widget is coming soon.

## How it works

1. **Create a checkout** — Set your settlement token, chain, destination, and accepted sources.
2. **User connects** — External wallet, exchange account, or deposit address.
3. **Quote and convert** — If the user's asset doesn't match your settlement config, a swap or bridge runs automatically.
4. **Settle** — Converted funds land at your destination. HMAC-signed webhooks fire at every state transition.

<Warning>
  Your application should make clear to end-users that asset conversion and cross-chain routing are executed by independent third-party providers. Users keep full control of their assets and must explicitly sign each transfer. On-chain transactions are final and cannot be reversed.
</Warning>

## Modes

Two operating modes depending on your use case:

* **Payment** — You set the amount (for example, \$25.00 in USDC). Use this for checkout flows with a fixed price.
* **Deposit** — The user sets the amount. Configure minimums and presets. Use this for account funding.

## Money in and money out

Fireblocks Flow is direction-agnostic. The source wallet, settlement token, and destination wallet are configured independently — so the same flow handles withdrawals and conversions out of your platform as well as deposits in.

| Flow                   | Source                                 | Destination                              |
| :--------------------- | :------------------------------------- | :--------------------------------------- |
| Deposit / payment      | End user's wallet or exchange          | Your treasury, vault, or merchant wallet |
| Withdrawal / money-out | Your treasury, vault, or server wallet | End user's wallet                        |
| Cross-chain conversion | Wallet A on chain X                    | Wallet B on chain Y (same owner)         |

For per-user withdrawals from a shared treasury, create one checkout and override the destination per transaction with `destinationAddresses` when you create the transaction. Withdrawals are supported through the [Fireblocks Flow API guide](/overview/fireblocks-flow-api#withdrawal-flow) only.

## Use cases

### Merchant and PSP crypto acceptance

Accept deposits in any token from any chain. Settle in USDC, USDT, or whichever stablecoin you prefer. Users don't need to bridge or swap manually. Works whether you're accepting deposits directly or processing them on behalf of your merchants.

### Payment service providers

Offer crypto deposit acceptance to your merchant base without building wallet, conversion, or compliance infrastructure. Use the API behind your own UI.

### iGaming and prediction markets

High-volume platforms can accept deposits from any user wallet or exchange, enforce compliance on every transaction, and settle directly to a Fireblocks vault or embedded wallet.

### Agentic deposits

AI agents can programmatically create transactions, attach funding sources, and submit via the API. Combine with [server wallets](/overview/wallets/overview) to automate deposits and make payments.

### Withdrawals and currency conversion

Send funds from your platform out to a user-owned wallet, converting across chains and tokens in a single flow. Use `deposit` mode with your treasury or vault as the source and the user's wallet as the destination — for example, withdraw SOL from a Fireblocks vault and deliver USDC on Ethereum to the user's self-custody address. One checkout configuration covers every user; override the destination per transaction with `destinationAddresses`. See the [Withdrawal flow](/overview/fireblocks-flow-api#withdrawal-flow) in the API guide for step-by-step HTTP instructions.

## Capabilities

### Settlement currencies

Choose your settlement token and chain. If a user deposits a different asset, the system routes through a swap or bridge automatically. You receive what you configured.

### Multi-chain support

Fireblocks Flow supports many source chains: EVM, Solana, Sui, Bitcoin, Stellar, and TON. Users can deposit from whichever chain they hold assets on.

<Note>
  Automatic swap and bridging is currently available for EVM, Solana, Sui, and Bitcoin. Deposits from Stellar and TON settle as-is in the source token.
</Note>

### Funding sources

#### Wallets

Users connect any supported external wallet — MetaMask, Phantom, Coinbase Wallet, and [dozens more](/overview/wallets-and-chains/overview).

#### Exchanges

Users deposit directly from their exchange account balance. Supported exchanges include Coinbase, Kraken, Crypto.com, and Binance. Robinhood is coming soon.

#### Deposit addresses

<Info>
  **Coming soon:** unique per-transaction deposit addresses so users or systems can send funds without connecting a wallet or exchange.
</Info>

### Swap and bridging

Cross-chain and cross-token conversion is fully abstracted. Provider selection, execution, and failover happen behind the scenes.

**Integrator fees:** You set your own fee on every swap transaction. This is direct revenue for your business.

### Memos

Attach a memo to any checkout transaction. Use memos to tie deposits to internal order IDs, user accounts, invoices, or any identifier your system needs for reconciliation and reporting. Memos persist through the full transaction lifecycle and are included in webhook payloads.

Memos also satisfy chain-level requirements for networks like Stellar and Cosmos where a memo or tag is required to route funds correctly.

### Destination types

Funds can settle to:

* **Custom address** — Any address you provide. Works with Fireblocks vaults and **embedded wallets**.

### Verification

Built-in compliance checks apply to all transactions.

**By default:**

* **Sanctions screening** — Connected wallet addresses are screened before funds move.
* **Geographic restrictions** — IP-based blocking per your configuration.

**Optional:**

* **Spam token filtering** — Known spam tokens are blocked when signature verification is enabled.
* **Name matching** *(optional)* — Verify depositor identity against expected names.
* **Signature verification** — Require a signed message to prove wallet ownership.

## Webhooks

HMAC-signed events fire at every lifecycle transition:

* Execution state changes (created → submitted → confirmed → settled)
* Settlement state changes
* Risk and compliance state changes
* Quote updates

See [Webhooks setup](/overview/developer-dashboard/webhooks/setup) for configuration.

<Warning>
  Dynamic does not control the swap, bridge, or routing protocols used to convert and deliver assets. Rates and fees are sourced from third-party providers and may change between quote and execution. Cross-chain transfers carry risk, including slippage, partial fills, and failed conversions. On-chain transactions are final and cannot be reversed. These materials are not investment, financial, legal, or tax advice. You are responsible for evaluation at your own discretion. Fireblocks Flow is infrastructure. Please review Dynamic terms and conditions for full details on acceptable use.
</Warning>
