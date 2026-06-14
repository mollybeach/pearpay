# Delegated Access + Fireblocks Flow — Local Wiring

How PearPay turns **one FaceID approval** into **autonomous server-side signing**,
and how the **Fireblocks Flow** cross-chain deposit is confirmed before control
passes to the downstream ZK / settlement modules.

Backend is **Node-native in the Next.js app** (not FastAPI) — one runtime, one
deploy. All API shapes below are taken verbatim from the Dynamic docs
(`app.dynamicauth.com/api/v0`).

---

## 1. Files added

| File | Role |
|------|------|
| `src/hooks/useDelegatedAuth.ts` | Frontend: FaceID → `delegateKeyShares()` |
| `src/components/DelegatedAuthButton.tsx` | Drop-in "Authorize with Face ID" button |
| `app/api/webhooks/dynamic/route.ts` | Receives `wallet.delegation.created`, HMAC-verifies, decrypts, stores |
| `src/integrations/dynamic/delegated-wallet.ts` | `ingestDelegation()` + `delegatedSignMessageForWallet()` |
| `src/integrations/dynamic/delegation-store.ts` | AES-256-GCM sealed-at-rest store + spend authorization |
| `src/integrations/flow/client.ts` | (existing) Flow 8-step client |

## 2. Environment

```bash
# Frontend (public)
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=...        # Dynamic environment id

# Server signing
DYNAMIC_ENV_ID=...                            # same environment id
DYNAMIC_API_TOKEN=dyn_...                      # server API token (checkout + delegated client)

# Delegated access
DYNAMIC_DELEGATION_WEBHOOK_SECRET=...          # from the webhook detail page
DYNAMIC_DELEGATED_RSA_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
DELEGATION_ENCRYPTION_KEY=<64-hex-chars>       # optional; else derived from wallet password
```

The RSA **public** key is configured on the Dynamic environment; the **private**
key never leaves the server and decrypts the webhook envelope.

---

## 3. Frontend — authenticate then delegate

```tsx
import { DelegatedAuthButton } from "@/components/DelegatedAuthButton";

<DelegatedAuthButton onDelegated={(addr) => startAgentSettlement(addr)} />
```

Under the hood (`useDelegatedAuth`):

1. `useWebAuthn().authenticate()` → native FaceID/TouchID over the page.
2. On success → `useWalletDelegation().delegateKeyShares()` (Dynamic React SDK).
   Empty args delegate every eligible embedded wallet for the user; Dynamic then
   POSTs `wallet.delegation.created` to our webhook with the encrypted share.

`delegateKeyShares()` throws `DelegationError` (with `successCount` /
`failureCount` / `successfulWallets` / `failedWallets`) on partial failure — the
hook surfaces that to the UI.

---

## 4. Backend — receive, verify, decrypt, store

`POST /api/webhooks/dynamic`:

1. **Verify** `x-dynamic-signature-256` = `sha256=HMAC_SHA256(rawBody, secret)`
   via `crypto.timingSafeEqual` over the **raw** body (re-serializing breaks it).
2. **Decrypt** `data.encryptedDelegatedShare` + `data.encryptedWalletApiKey`
   (hybrid RSA-OAEP-SHA256 + AES-256-GCM) with the Dynamic Node SDK:

   ```ts
   const { decryptedDelegatedShare, decryptedWalletApiKey } =
     decryptDelegatedWebhookData({
       privateKeyPem,
       encryptedDelegatedKeyShare: data.encryptedDelegatedShare,
       encryptedWalletApiKey: data.encryptedWalletApiKey,
     });
   ```
3. **Seal & store** `{ walletApiKey, keyShare }` with AES-256-GCM keyed off
   `DELEGATION_ENCRYPTION_KEY`. `eventId` is the idempotency key.

### Autonomous signing

```ts
import { delegatedSignMessageForWallet } from "@/integrations/dynamic/delegated-wallet";

const res = await delegatedSignMessageForWallet(walletId, digest, { amountUsd: 45 });
// -> { signature, address }  — or null if no active delegation
```

`delegatedSignMessageForWallet` enforces the **spend authorization** captured at
delegation time (`maxAmountUsd`, `expiresAt`, running `spentUsd`) before calling
`delegatedSignMessage(client, { walletId, shareSetId, walletApiKey, keyShare, message })`.
This signature feeds the downstream Unlink / Arc x402 payloads — the agent never
re-prompts the user.

---

## 5. Fireblocks Flow — endpoints & the session-token polling loop (task #3)

Base URL: `https://app.dynamicauth.com/api/v0`

| Step | Method + path | Auth | Advances to |
|------|---------------|------|-------------|
| 1. Create checkout | `POST /environments/{envId}/checkouts` | `Authorization: Bearer dyn_…` | (reusable `checkoutId`) |
| 2. Create transaction | `POST /sdk/{envId}/checkouts/{checkoutId}/transactions` | none | returns `sessionToken` (`dct_…`) + `transaction.id`, `executionState: "initiated"` |
| 3. Attach source | `POST /sdk/{envId}/transactions/{txId}/source` | `x-dynamic-checkout-session-token: dct_…` | `source_attached` |
| 4. Get quote | `POST /sdk/{envId}/transactions/{txId}/quote` | session token | `quoted` (quote expires in **60s**) |
| 5. Prepare | `POST /sdk/{envId}/transactions/{txId}/prepare` | session token | `signing` + `quote.signingPayload` |
| 6. Sign + broadcast | *(client wallet signs `signingPayload`, submits on-chain)* | — | returns `txHash` |
| 7. Notify backend | `POST /sdk/{envId}/transactions/{txId}/broadcast` `{ txHash }` | session token | `broadcasted` — **point of no return** |
| 8. Wait for settlement | `GET /sdk/{envId}/transactions/{txId}` | none | poll until terminal |

**The `dct_` session token is returned once in Step 2 and authenticates every
mutation (3–7). Reads (Step 8) need no auth.**

### Step 8 — the deposit-cleared gate

Poll **every 3 seconds**. `settlementState` progresses
`none → routing → bridging → swapping → settling → completed`
(same-chain, same-token jumps straight to `completed`):

```ts
async function waitForFlowSettlement(envId: string, txId: string) {
  const TERMINAL_OK = "completed";
  const deadline = Date.now() + 120_000; // 2 min budget

  while (Date.now() < deadline) {
    const res = await fetch(
      `https://app.dynamicauth.com/api/v0/sdk/${envId}/transactions/${txId}`,
    );
    const tx = await res.json();

    if (tx.settlementState === TERMINAL_OK) return tx;          // ✅ funds landed on Arc
    if (
      tx.settlementState === "failed" ||
      tx.executionState === "failed" ||
      tx.executionState === "cancelled" ||
      tx.executionState === "expired"
    ) {
      throw new Error(`Flow failed: ${tx.executionState}/${tx.settlementState}`);
    }
    await new Promise((r) => setTimeout(r, 3_000));
  }
  throw new Error("Flow settlement timed out");
}
```

**Only after `settlementState === "completed"`** — i.e. USDC has actually
materialized on Arc Testnet — does PearPay hand the deposit to the downstream
ZK/settlement modules (Unlink shield → Arc x402). The risk state must also be
`cleared`; a `422` at Step 5 means re-poll `GET /transactions/{txId}` until
`riskState === "cleared"`, then retry prepare.

### Production: webhooks instead of polling (recommended)

```
POST /environments/{envId}/webhooks
Authorization: Bearer dyn_…
{ "url": "https://pearpay.app/api/webhooks/flow",
  "events": ["settlement.state.completed","settlement.state.failed","execution.state.failed"],
  "isEnabled": true }
```

`app/api/webhooks/flow/route.ts` already handles `settlement.state.completed`
and marks the Flow session settled.

---

## 6. End-to-end sequence

```
FaceID ──▶ delegateKeyShares() ──▶ wallet.delegation.created webhook
                                        │  (HMAC verify → RSA decrypt → seal)
                                        ▼
                                 delegation stored
Flow:  create checkout → create tx (dct_) → attach source → quote → prepare
       → client signs → broadcast(txHash) → POLL GET /transactions/{id}
                                        │  settlementState === "completed"
                                        ▼
       agent: delegatedSignMessageForWallet() ──▶ Unlink shield ──▶ Arc x402 settle
```
