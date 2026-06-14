# Arc Pitch Script

**Track:** Best Smart Contracts on Arc · Best Chain Abstracted USDC Apps · **Prize:** $15,000 · **Live:** [pearpay.app/pay](https://pearpay.app/pay) · **Verify:** `npm run verify:arc`

---

Hi — I'm pitching Pear Pay for the Arc bounty. The problem we're solving is simple: people want to send USDC from a conversation, not from a wallet app. Pear Pay lets you type "Send Molly twenty dollars" in iMessage, Telegram, or Discord — and every payment ultimately settles in USDC on Arc Testnet. Users never pick a chain. They never see chain IDs. Arc is the liquidity hub.

For recipients who already have a wallet, Pear Pay calls settleUsdc and returns a real Arcscan receipt — a genuine on-chain USDC transfer on chain 5042002. You can try this yourself on pearpay.app/pay: connect a browser wallet, send Circle testnet USDC, open the explorer link. That's not a mock.

For recipients who don't have a wallet yet, we built PearPayEscrow.sol — deployed live on Arc Testnet at 0x065484A8DAc3A9c3288b9C575a54947B0A1bC7eB. The sender escrows USDC against a claim hash. The recipient gets a claim link, taps it, onboarded via Dynamic, and claim releases the funds. If they never claim, refund returns the USDC to the sender after expiry. Sender can cancel. Optional arbiter for disputes. That's advanced stablecoin logic — conditional release, time-based automation, multi-step settlement — not a one-shot transfer.

Chain abstraction is the other Arc track. Pear Pay treats Arc as the settlement surface for every non-private payment. Circle Gateway bridge mints USDC onto Arc from a cross-chain unified balance when credentials are set — the user still never picks a chain. Private payments route through Unlink, but the public leg still settles on Arc when needed.

For agent commerce we use Circle's x402 batching SDK — gas-free sub-cent USDC nanopayments on Arc via BatchFacilitatorClient. The homepage Autonomous Private Agent timeline ends with a verifiable x402 settlement on testnet.arcscan.app.

Arc isn't a logo on our slide — it's where every dollar lands. Escrow on Arc, settlement on Arc, x402 on Arc, explorer receipts on Arc. npm run verify:arc deploys if needed, escrows 0.01 USDC, claims it, and prints ArcScan URLs you can click right now.

Pear Pay — conversational payments, Arc-native USDC settlement. Thank you.
