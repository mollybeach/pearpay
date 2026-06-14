# Finalist Pitch Script

**Audience:** ETHGlobal NYC judges · **Length:** ~3–4 min · **Live:** [pearpay.app](https://pearpay.app)

---

Pear Pay is the Apple Pay for Web3 — send money anywhere you already communicate. iMessage, Telegram, Discord, WhatsApp, Slack, X, SMS, voice, or between AI agents. You just say what you want: "Send Molly twenty dollars." No wallet addresses, no chain selection, no gas, no crypto jargon.

Behind that one message is a full payment stack. An NLP parser turns plain English into a structured payment intent — recipient, amount, privacy flag. A universal resolver maps names, phones, emails, and handles to delivery modes. A settlement orchestrator picks the best rail — Arc for public USDC, Unlink for private — and returns a result every channel can render natively.

Let me show you what that feels like. In iMessage I type "Send Molly twenty dollars" — just like a text. Confirm with Face ID. Pear Pay resolves Molly as an existing user and settles instantly in USDC. Done.

What if Alex doesn't have a wallet yet? I send Alex fifty dollars. Pear Pay escrows the USDC on Arc in PearPayEscrow.sol and delivers a claim link by text. Alex taps it, gets a Dynamic embedded wallet instantly, and the funds release. Payments never fail because someone hasn't onboarded.

Privacy is built in — just add "privately." Pear Pay routes through Unlink's shielded pool so amounts and counterparties stay hidden, while still settling in USDC on Arc.

Same brain, different skin. Telegram bot, Discord slash commands, WhatsApp quick-replies, Slack splits, X DMs — one parser, one orchestrator, six native confirmation patterns.

That's the simulator. This is real. On the Try It page I connect my wallet and send actual Circle testnet USDC on Arc — signed by me, verifiable on Arcscan. Not a mock.

Pear Pay also powers AI agents. One click on the homepage — the agent shields funds with Unlink, pays an x402 API with Dynamic, and settles on Arc. Human payments and machine payments, same infrastructure.

And there's a live Telegram bot at t.me/pearpay_bot. DM it in plain English and Pear Pay runs the same orchestrator, right inside your chat.

Four sponsors wired at production depth — Arc for USDC settlement and escrow, Dynamic for embedded wallets Flow and delegated agent signing, Unlink for private transfers and unlinkable nanopayments, Twilio for claim-link delivery. One hundred seven tests, a deployed escrow contract, and npm run judge:demo to prove it all works.

Pear Pay — turn conversations into transactions. Try it live at pearpay.app.
