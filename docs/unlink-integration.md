# Unlink Integration — Private Payments for Pear Pay

> Status: **live & verified on Arc testnet.** The real `@unlink-xyz/sdk@0.3.x`
> is wired and a private payment has been confirmed end-to-end (shielded
> deposit → withdraw to a fresh recipient). It falls back to a deterministic
> stub when the Unlink env vars are unset (see [Flip it on](#flip-it-on)).

This document is the single source of truth for how Pear Pay integrates Unlink:
the prize we're targeting, the official docs, the SDK API, what becomes private,
and exactly how it's wired in the codebase.

---

## 1. The prize — Unlink ($5,000)

Unlink is **the embedded privacy SDK** — private balances, transfers, and DeFi
access on the EVM chains users already use. Audit-ready and compliant by
default. Core primitives: `deposit()`, `transfer()`, `withdraw()`, `execute()`.

| Target | Prize | What it asks |
|--------|-------|--------------|
| **Best Private Nano Payment App** (joint w/ Dynamic + Arc) | 1st $2,000 · 2nd $1,000 | Dynamic (wallet creation) + Unlink (private accounts/routing) + Arc (settlement) → private nanopayments |
| **Best Unlink Integration into a Major Open-Source App** | $2,500 | Route a real app's flows through private balances |

**Qualification checklist:**

- [x] Integrate the Unlink SDK (`@unlink-xyz/sdk@0.3.x`) **during the event**
- [x] Use at least one private primitive: `deposit()` / `transfer()` / `withdraw()` / `execute()` — we use **deposit + withdraw**
- [x] Working demo showing the flow running **privately** — verified live on Arc testnet (`LIVE_UNLINK=1 … tests/unlink-live.test.ts`)
- [x] Public repo + README explaining exactly **what is now private**
- [ ] **Joint prize:** also use the Dynamic SDK + Circle's tools (we already do)

---

## 2. The docs (referenced)

- Unlink docs: <https://docs.unlink.xyz>
- Full API index (for LLMs): <https://docs.unlink.xyz/llms.txt>
- Dynamic × Unlink × Arc integration guide: <https://docs.unlink.xyz/partner-integrations>
- Circle Nanopayments (Gateway): <https://developers.circle.com/gateway/nanopayments>
- <https://unlink.xyz>

### The real SDK API (`@unlink-xyz/sdk@0.3.0-canary.621`)

The Arc-testnet engine authorizes shielded transactions with an ERC-4337
`execution_intent_v1` scheme (see `GET /info/environment`), so deposits must be
signed by an EVM provider. The `0.3.x` SDK implements this; the older `0.0.2`
Permit2-only deposit path is rejected by this engine.

```ts
import { createUnlinkClient, account, evm } from "@unlink-xyz/sdk/client";

const client = createUnlinkClient({
  engineUrl,                                          // arc-testnet-production-api.unlink.xyz
  account: account.fromMnemonic({ mnemonic }),        // server Unlink account
  evm: evm.fromViem({ walletClient, publicClient }),  // signs Permit2 + execution intent
  register: async () => {},                           // server account is pre-registered
  authorizationToken: { provider: async () => ({ token: apiKey, expiresAt }) },
});
await client.ensureRegistered();

// Private operations on UnlinkClient (amounts are BASE-UNIT strings, e.g. "50000"):
await client.depositWithApproval({ token, amount }); // shield public → private (+ ERC-20 approval)
await client.transfer({ token, amount, recipientAddress }); // private hop to an unlink1… address
await client.withdraw({ recipientEvmAddress, token, amount }); // exit to a public EOA
// → each returns a TransactionHandle; await handle.wait() → TransactionResult { txId, txHash, status }
```

Delivering a private payment to an **EVM recipient** is **deposit → withdraw**
(transfer's `recipientAddress` is a bech32m `unlink1…` address, not an EVM one).
`environment` for our settlement chain is **`arc-testnet`**.

---

## 3. How Pear Pay integrates Unlink

**The product promise:** privacy is a *feature, not a premium*. A user just adds
"privately" to any message:

```
"Send Sarah 50 USDC privately"
```

…and Pear Pay routes that payment through Unlink so **the amount, the balances,
and the counterparties are hidden on-chain.**

### What becomes private

| Visible without Unlink | With Unlink (private rail) |
|------------------------|----------------------------|
| Sender → recipient address link | **Hidden** — unlinkable via the shielded pool |
| Transfer amount | **Hidden** — shielded note, not a public ERC-20 transfer |
| Running balance | **Hidden** — private balance |

### Where it's wired

1. **NLP** (`src/core/nlp/parser.ts`) sets `intent.private = true` for
   "privately/anonymously" messages.
2. **Rail selection** (`src/core/payments/settlement.ts` → `selectRail`)
   returns the **`unlink`** rail whenever `isPrivate`.
3. **Settlement** (`settleOnRail("unlink", …)`) calls
   `privateTransfer()` so amounts and counterparties stay shielded.
4. **Integration** (`src/integrations/unlink/index.ts`) wraps the SDK:
   - `deposit()` → `client.depositWithApproval({ token: USDC, amount })`
   - `privateTransfer()` → shields the shortfall (`depositWithApproval`) then
     `client.withdraw({ recipientEvmAddress, token, amount })` so funds reach an
     EVM recipient through the pool, unlinkable from the funder
   - `withdraw()` → `client.withdraw({ recipientEvmAddress, token, amount })`
   - Gated by config; **deterministic stub** (no SDK/network) when unset, so
     demos and tests run offline. Client is created lazily + cached.
5. **API** (`app/api/privacy/shield/route.ts`) exposes `POST /api/privacy/shield`
   which runs a real `transfer()` and returns `{ status, note_id, mode }`.
6. **UI**: the chat playgrounds render the **"PRIVATE 🕶️ · Unlink · shielded"**
   card for private payments (`PearPayCard`, `outcome: "private"`).

### Joint Dynamic × Unlink × Arc nanopayments flow

Per the partner guide, the unlinkable path is:

```
Dynamic wallet (auth)
   → Unlink private account  (deposit → private balance)
   → Unlink transfer         (optional private hops; amount + party hidden)
   → Unlink withdraw         (exit to a FRESH payer EOA — breaks the funding link)
   → Arc / Circle Gateway    (settle USDC from the unrelated EOA)
```

The payer EOA that finally settles on Arc **cannot be linked back to the user's
original Dynamic funding wallet** — that's the privacy guarantee, ideal for
private micropayments for AI inference and pay-per-request APIs.

---

## 4. Flip it on

Set these in `.env` (all already scaffolded), then restart:

```bash
UNLINK_API_KEY=          # dashboard.unlink.xyz → project → API Keys
UNLINK_ENGINE_URL=https://arc-testnet-production-api.unlink.xyz
UNLINK_PROJECT_ID=       # dashboard project UUID (reference; optional)
UNLINK_ENVIRONMENT=arc-testnet
UNLINK_ACCOUNT_MNEMONIC= # cast wallet new-mnemonic — NOT cast wallet new
```

See [`docs/UNLINK_BOUNTY.md`](./UNLINK_BOUNTY.md) for the full judging demo script.

With all three (key + engine + mnemonic) present, `isConfigured()` flips true
and every private payment runs through the **real** Unlink SDK. Verify:

```bash
curl -s -XPOST localhost:3000/api/privacy/shield \
  -H 'content-type: application/json' \
  -d '{"amount":50,"recipient":"+15555550123","intent_id":"t1"}'
# → { "status": "shielded", "note_id": "...", "mode": "live" }
```

---

## 5. Files

| File | Role |
|------|------|
| `src/integrations/unlink/index.ts` | SDK wrapper — `deposit` / `privateTransfer` / `withdraw` |
| `src/core/payments/settlement.ts` | `selectRail` private path → `unlink` |
| `app/api/privacy/shield/route.ts` | `POST /api/privacy/shield` |
| `src/lib/unlink.ts` | client helper `shieldPayment()` |
| `src/lib/env.ts` | `UNLINK_API_KEY` / `UNLINK_ENGINE_URL` / `UNLINK_ENVIRONMENT` / `UNLINK_ACCOUNT_MNEMONIC` |
| `next.config.mjs` | `@unlink-xyz/sdk` in `serverComponentsExternalPackages` |
| `tests/unlink.test.ts` | private primitives + rail tests |

Tracks GitHub issue **#6**.
