# Dynamic Pitch Script

**Track:** Best Use of Flow · Best Agentic Build · Best Overall · Joint Nanopayments · **Prize:** $10,000 · **Live:** [pearpay.app](https://pearpay.app) · **Verify:** `npm run verify:dynamic`

---

Hi — I'm pitching Pear Pay for the Dynamic bounty. Pear Pay turns chat messages into payments, and Dynamic powers our entire wallet layer — embedded onboarding, Fireblocks Flow, Delegated Access, and autonomous agent wallets.

The cold-start problem kills most crypto payment apps. Pear Pay solves it with Dynamic embedded wallets on claim. Someone sends "Pay Alex fifty dollars." Alex has no wallet. Pear Pay escrows the USDC, delivers a claim link, Alex taps it — createEmbeddedWallet spins up a wallet instantly. No seed phrase, no app download. The escrow releases and Alex has USDC. That's Dynamic embedded wallets doing real work in a consumer flow.

For cross-chain checkout we built the full Fireblocks Flow pipeline — create transaction, attach source, quote, prepare, sign, broadcast, webhook. A user can hold ETH on Arbitrum or USDC on Base, tap Pay with Face ID, and Flow routes to USDC on Arc for the recipient. Per-payment destinationAddresses point to the agent or merchant on Arc. The eight-step checkout lives at /api/flow/payment/* with HMAC webhook verification at /webhooks/flow.

Delegated Access is where it gets agentic. The user approves once with Face ID via WebAuthn. Dynamic POSTs encrypted MPC key shares to our webhook. We seal them at rest and the backend can sign autonomously within spend bounds — no wallet popup on every API call. That's the difference between a demo and a product.

For true agent autonomy we run Dynamic server wallets and delegated MPC wallets against HTTP 402 paywalls. POST /api/agent/run-intent — the agent proposes, decides, executes, and completes. POST /api/agent/delegated-pay — same loop but signed via delegated key shares. The homepage PrivateAgentRun timeline shows this live: Dynamic signs authorization, then Unlink shields, then Circle Gateway x402 settles on Arc. One click, full audit trail.

Pear Pay never holds user keys. Dynamic proposes wallets; users confirm with biometrics; agents sign via server or delegated MPC. Human path: chat → Face ID → Flow → USDC on Arc. Agent path: intent → server wallet → 402 → pay → 200. Same orchestrator, two modes.

Dynamic isn't one feature in our stack — it's how humans onboard, how checkout crosses chains, and how agents pay 24/7 without a human in the loop. npm run verify:dynamic checks env and runs Flow and x402 unit tests.

Pear Pay — Dynamic wallets for people, Flow for checkout, delegated MPC for agents. Thank you.
