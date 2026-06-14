# PearPay — Human Checklist (everything only YOU can do)

The code is built. This is the exact list of accounts, API keys, wallets, dashboard
toggles, and commands a human must complete to take it live and win the prizes.
Work top to bottom. Paste any key to the assistant and it will write it into `.env`
for you (so you never hand-edit files).

Legend: 🔑 key to obtain · 🖥️ dashboard action · 💰 wallet/funds · ▶️ command you run.

---

## 0. Install + local sanity (do first)
▶️ In Terminal:
```bash
cd /Users/priyansh/Desktop/pearpay/pearpay-molly
npm i @circle-fin/x402-batching @x402/core @x402/evm
npm run typecheck     # must say: No errors
npm test              # must pass (incl. x402-gateway + burner tests)
npm run build         # must succeed
```
If any fail, paste the full error to the assistant.

▶️ **Pin the Circle chain name** (one-time, the one value I couldn't auto-detect):
```bash
node -e "const c=require('@circle-fin/x402-batching/client'); console.log(Object.keys(c)); try{console.log(require('@circle-fin/x402-batching/dist/index.js'))}catch(e){}"
```
Find the Arc-testnet chain literal (e.g. it may be `arc-sepolia` / `arc-testnet`), and tell the assistant → it sets `X402_CHAIN_NAME`.

---

## 1. Dynamic  (Best Use of Flow · Agentic · Money App)
🖥️ **app.dynamic.xyz** → your **Sandbox** environment:
- Developers → **SDK & API Keys**: copy 🔑 `DYNAMIC_API_TOKEN` (`dyn_…`) and the **Environment ID** → `DYNAMIC_ENV_ID` + `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`.
- Wallets → **Embedded Wallets**: enable. → set 🔑 `DYNAMIC_WALLET_PASSWORD` (any strong string you choose).
- **Enable Fireblocks Flow** for the environment (ask the Dynamic booth to flip it for ETHGlobal). 🖥️ In Flow settings, add **Arc Testnet (chain 5042002)** as a settlement chain and **USDC** as a settlement token, and add **Base + Ethereum** as source chains. *(This is what fixes the `USDC@EVM-5042002: unknown` quote error.)*
- Delegated Access: 🖥️ enable it; paste the RSA **public** key from `secrets/dynamic_delegation_public.pem` (already generated) into the delegated-access field.
- Webhooks: 🖥️ create a webhook → URL `https://<deployed-domain>/api/webhooks/dynamic`, events `wallet.delegation.created` + `wallet.delegation.revoked` → copy 🔑 `DYNAMIC_DELEGATION_WEBHOOK_SECRET`. *(Skip until deployed; needs a public URL.)*

## 2. Circle / Arc  (Smart Contracts · Chain-Abstracted · x402)
🔑 **console.circle.com** → API & Client Keys → create → `CIRCLE_API_KEY`.
💰 **Deployer + funder wallet**:
```bash
cast wallet new            # prints an address + private key
```
→ put the private key in 🔑 `PRIVATE_KEY` and 🔑 `FUNDER_PRIVATE_KEY`.
💰 Fund that address with **Arc testnet USDC** + gas at **faucet.circle.com** (select Arc testnet).
▶️ Deploy the escrow contract:
```bash
npm run deploy:escrow      # writes ARC_ESCROW_CONTRACT_ADDRESS into .env
```
💰 **x402 buyer wallet** (the agent that pays): either reuse `FUNDER_PRIVATE_KEY` or `cast wallet new` again → 🔑 `X402_BUYER_PRIVATE_KEY`, and fund it with a little testnet USDC. Set 🔑 `X402_SELLER_ADDRESS` to the address that should receive nanopayments (your funder address is fine).

## 3. Unlink  (Private Nanopayments · Major-App Integration)
🖥️ **dashboard.unlink.xyz** → create project:
- 🔑 `UNLINK_API_KEY`
- `UNLINK_ENGINE_URL=https://arc-testnet-production-api.unlink.xyz`
- 💰 `UNLINK_ACCOUNT_MNEMONIC` — generate a NEW mnemonic (NOT a hex key):
  ```bash
  cast wallet new-mnemonic
  ```
  Register that account with the engine (the dashboard or `npm run verify:unlink` does this).

## 4. (Optional) Twilio — SMS/WhatsApp claim links
🔑 console.twilio.com → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, a Messaging Service SID, a Verify Service SID, and a sender number. Only needed for the claim-by-SMS demo.

---

## 5. Verify each integration locally (after keys are in `.env`)
▶️ (keep `npm run dev` running in another tab)
```bash
npm run verify:dynamic        # env + Flow client OK
npm run verify:flow           # status→start→source→QUOTE must pass (needs §1 toggles)
npm run verify:arc            # escrows + claims 0.01 USDC on Arc → prints ArcScan URLs
npm run verify:unlink         # registers account + probes a private transfer
npm run fund:unlink-pool      # shield ~0.10 USDC into Unlink private balance (run before nanopay)
npm run verify:nanopay        # joint Unlink burner → Circle x402 on Arc (needs dev server)
curl -s -X POST http://localhost:3000/api/privacy/nanopay \
  -H 'content-type: application/json' \
  -d '{"amount_usd":"0.001"}' | jq .
# expect: { ok:true, burner:"0x…", fundTxId:"0x…", settlementTx:"0x…" }
```

---

## 6. Deploy (only when §5 is all green)
1. ▶️ `git add -A && git commit -m "live integrations" && git push`
2. 🖥️ **Vercel** → import the repo → add **every** `.env` var in Project Settings → Environment Variables.
3. 🖥️ Set production URLs: `APP_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `WEBAUTHN_ORIGIN`, `WEBAUTHN_RP_ID=pearpay.app`.
4. 🖥️ Now register the Dynamic webhook (§1) with the real `https://pearpay.app/...` URL and paste the secret.
5. ▶️ Final gate:
   ```bash
   BASE_URL=https://pearpay.app npm run judge:demo   # all 3 sections must exit 0
   ```

---

## 7. Submission
- 🖥️ Record a 2–4 min, 1080p, un-sped screen capture (intent → FaceID → shielding → 402/EIP-3009 settle → ArcScan hash → burner disposed).
- 🖥️ Public GitHub repo + README explaining each integration and **what is private**.
- 🖥️ Submit the ETHGlobal form (answers in `docs/Submission.md`); state which bounties you're entering.

---

## Quick reference — every secret the app reads
| Variable | From | Section |
|---|---|---|
| `DYNAMIC_API_TOKEN`, `DYNAMIC_ENV_ID`, `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` | Dynamic dashboard | 1 |
| `DYNAMIC_WALLET_PASSWORD` | you choose | 1 |
| `DYNAMIC_DELEGATION_WEBHOOK_SECRET` | Dynamic webhook page | 1/6 |
| `DYNAMIC_DELEGATED_RSA_PRIVATE_KEY_PEM`, `DELEGATION_ENCRYPTION_KEY` | already generated ✅ | — |
| `CIRCLE_API_KEY` | console.circle.com | 2 |
| `PRIVATE_KEY`, `FUNDER_PRIVATE_KEY` | `cast wallet new` + faucet | 2 |
| `ARC_ESCROW_CONTRACT_ADDRESS` | `npm run deploy:escrow` | 2 |
| `X402_SELLER_ADDRESS`, `X402_BUYER_PRIVATE_KEY`, `X402_CHAIN_NAME` | wallet + §0 | 2 |
| `UNLINK_API_KEY`, `UNLINK_ENGINE_URL`, `UNLINK_ACCOUNT_MNEMONIC` | dashboard.unlink.xyz | 3 |
| `TWILIO_*` | console.twilio.com | 4 (optional) |
