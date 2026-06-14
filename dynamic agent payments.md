> ## Documentation Index
> Fetch the complete documentation index at: https://www.dynamic.xyz/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Agent Payments

> How agents can pay for API access automatically using HTTP 402 payment flows, with Dynamic server wallets and x402 or Tempo MPP.

Agents often need to pay for services—API calls, data access, compute—without a human approving each payment. HTTP **402 Payment Required** is designed for this: when the agent calls a 402-protected API, the server returns payment requirements; the agent pays and retries; the server delivers the resource.

Dynamic server wallets provide the signing and key management layer. The wire format and settlement depend on which protocol you use.

### Reference implementation

[`dynamic-agent-payments`](https://github.com/dynamic-labs-oss/dynamic-agent-payments) is a working CLI and MCP server that pays both x402 and Tempo MPP APIs from a Dynamic server wallet. When the agent holds the wrong token or chain, it calls [Fireblocks Flow](/overview/fireblocks-flow-api) to swap or bridge before signing.

```bash theme={"system"}
npx dynamic-agent-payments wallet
npx dynamic-agent-payments pay https://x402-api.fly.dev/api/price-feed
npx dynamic-agent-payments pay-mpp https://api.example.com/resource
```

<Card title="dynamic-agent-payments on GitHub" href="https://github.com/dynamic-labs-oss/dynamic-agent-payments">
  CLI and MCP server for paying x402 and MPP APIs from a Dynamic server wallet, with cross-chain auto-funding via Checkout.
</Card>

***

### Build with x402

The [x402 protocol](https://www.x402.org/) defines how onchain payment is negotiated over HTTP. The client receives payment requirements in the 402 response, signs with its wallet, and retries the request with an `X-Payment` header. A facilitator (for example, the [Fireblocks x402 facilitator](https://developers.fireblocks.com/docs/x402-facilitator-overview)) verifies and settles onchain.

**Best for:** x402-protected APIs, zero-fee USDC payments on Base, Fireblocks facilitator.

<Card title="Using Dynamic with x402" href="/recipes/integrations/x402/implementation">
  Wire up a Dynamic server wallet as the x402 payment client.
</Card>

***

### Build with Tempo MPP

[Tempo's Machine Payment Protocol (MPP)](https://docs.tempo.xyz) extends HTTP 402 for machine-to-machine traffic. The `mppx` client handles negotiation, signing, and retry automatically. Dynamic's Node SDK provides the MPC-backed signing account.

**Best for:** APIs and services that target Tempo's network, machine-to-machine payments on Tempo Moderato.

<Card title="Machine Payments on Tempo (Node.js)" href="/recipes/integrations/tempo-mpp">
  Create a Dynamic server wallet, fund it, and make MPP payments to 402-protected APIs.
</Card>

## Choosing a protocol

If you're building your own integration, x402 and Tempo MPP target different settlement layers:

|                | x402                       | Tempo MPP     |
| -------------- | -------------------------- | ------------- |
| Protocol       | x402                       | MPP           |
| Settlement     | Onchain (Base, USDC)       | Tempo network |
| Client library | `x402-fetch`, `x402-axios` | `mppx`        |
| Facilitator    | Fireblocks (and others)    | Tempo         |

For a full comparison and background on how 402 flows work, see the [HTTP 402 overview](/recipes/integrations/x402/overview).

## Related

* [Server Wallets Setup](/node/wallets/server-wallets/overview) — create and manage the wallets your agent uses to pay
* [Agents Overview](/overview/agents/overview) — wallet patterns for autonomous agents and agents acting for users
