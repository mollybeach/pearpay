# Unlink Integration — Private Payments for Pear Pay

> Status: **wired & passing in stub mode.** The real `@unlink-xyz/sdk` is
> installed and the code calls the actual SDK primitives; it activates the
> moment the three Unlink env vars are set (see [Flip it on](#flip-it-on)).

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

- [x] Integrate the Unlink SDK (`@unlink-xyz/sdk`) **during the event**
- [x] Use at least one private primitive: `deposit()` / `transfer()` / `withdraw()` / `execute()` — we use **transfer + deposit + withdraw**
- [ ] Working demo showing the flow running **privately** (needs a live API key)
- [x] Public repo + README explaining exactly **what is now private**
- [ ] **Joint prize:** also use the Dynamic SDK + Circle's tools (we already do)

---

## 2. The docs (referenced)

- Unlink docs: <https://docs.unlink.xyz>
- Full API index (for LLMs): <https://docs.unlink.xyz/llms.txt>
- Dynamic × Unlink × Arc integration guide: <https://docs.unlink.xyz/partner-integrations>
- Circle Nanopayments (Gateway): <https://developers.circle.com/gateway/nanopayments>
- <https://unlink.xyz>

### The real SDK API (`@unlink-xyz/sdk@0.0.2-canary.0`)

```ts
import { createUnlink, unlinkAccount } from "@unlink-xyz/sdk";

const account = unlinkAccount.fromMnemonic({ mnemonic });      // also fromSeed / fromKeys
const client = createUnlink({ engineUrl, apiKey, account });   // backend client
await client.ensureRegistered();

// The four private operations on UnlinkClient:
await client.deposit({ token, amount });                                  // shield public → private
await client.transfer({ token, amount, recipientAddress });              // private hop (amount + party hidden)
await client.withdraw({ recipientEvmAddress, token, amount });           // exit to a fresh public EOA
// (execute() is the contract-call primitive; not exposed on the client in
//  this canary — transfer is our private primitive of record.)
// → each returns TransactionResult { txId, status }
```

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
   `privateTransfer()` and records a tamper-proof HCS audit receipt (without
   leaking the amount — the receipt logs the rail, not the cleartext value).
4. **Integration** (`src/integrations/unlink/index.ts`) wraps the SDK:
   - `deposit()` → `client.deposit({ token: USDC, amount })`
   - `privateTransfer()` → `client.transfer({ token, amount, recipientAddress })`
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

Set these in `.env.local` (all already scaffolded), then restart:

```bash
UNLINK_API_KEY=          # from https://docs.unlink.xyz quickstart
UNLINK_ENGINE_URL=       # Unlink engine endpoint for arc-testnet
UNLINK_ENVIRONMENT=arc-testnet
UNLINK_ACCOUNT_MNEMONIC= # server-side Unlink account seed (12/24 words)
```

With all three (key + engine + mnemonic) present, `isConfigured()` flips true
and every private payment runs through the **real** Unlink SDK. Verify:

```bash
curl -s -XPOST localhost:3000/api/privacy/shield \
  -H 'content-type: application/json' \
  -d '{"amount":50,"recipient":"molly.eth","intent_id":"t1"}'
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
