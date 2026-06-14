# Unlink Pitch Script

**Track:** Best Private Nano Payment App · Best Unlink Integration · **Prize:** $5,000 · **Live:** [pearpay.app/messages](https://pearpay.app/messages) · **Verify:** `npm run verify:unlink` · `npm run verify:nanopay`

---

Hi — I'm pitching Pear Pay for the Unlink bounty. Most payment apps treat privacy as a premium feature or a separate app. Pear Pay treats it as a word. Add "privately" to any message — "Send Molly fifty USDC privately" — and the orchestrator selects the Unlink rail automatically. Same chat UX, same confirmation flow, shielded settlement underneath.

We integrated the real @unlink-xyz/sdk on Arc Testnet — createUnlink, unlinkAccount.fromMnemonic, ensureRegistered. Three primitives power the product: deposit shields public USDC into a private balance, transfer moves funds with amount and counterparty hidden, withdraw exits to a fresh public EOA when the public leg needs to break the link. Rail selection is one line — if isPrivate, Unlink; else Arc.

In the chat simulator you see it immediately. Type "Send Molly fifty USDC privately" in iMessage, Telegram, or Discord. Confirm. The payment card shows PRIVATE with the shielded badge — counterparty and amount stay hidden on-chain while Pear Pay still settles in USDC.

For the joint Dynamic plus Unlink plus Arc nanopayments prize we built something harder: unlinkable x402 payments. POST /api/privacy/nanopay shields USDC from the pool into a single-use burner EOA. That burner pays the x402 API via Circle Gateway on Arc — gas-free, sub-cent. Then we dispose the key. On Arcscan the payer is the burner, not the user. The chain never links user to seller.

The homepage Autonomous Private Agent timeline runs this end to end — Dynamic signs authorization, Unlink shields into the burner, Circle x402 settles on Arc. Judges can open the settlement transaction on testnet.arcscan.app and see zero gas, burner as payer, user wallet nowhere in the trail.

What's private: the counterparty link, the transfer amount, and per-payment identity. What's public: only what the protocol requires for settlement — and even that goes through a fresh burner each time.

Privacy isn't a settings screen. It's built into natural language. No separate app, no ZK explainer, no "switch to privacy mode." Just say privately.

npm run verify:unlink registers the SDK client and hits /api/privacy/shield. npm run verify:nanopay returns a settlementTx you can open on Arcscan.

Pear Pay — Unlink shielded transfers for humans, burner nanopayments for agents, Arc for the public settlement leg. Thank you.
