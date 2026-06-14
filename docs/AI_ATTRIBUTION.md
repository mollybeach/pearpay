# PearPay Attribution — ETHGlobal NYC 2026

## Team

- **Molly Beach** — product architecture, NLP, orchestrator, escrow, channels, iOS, and contracts
- **Priyansh** — Flow integration, WebAuthn/FaceID, OG pay flow, Dynamic wallet UI, and agent x402 demo

## Project Areas

| Area | Scope |
|------|-------|
| Conversational payments | Parser, recipients, orchestration, escrow, Twilio, channels |
| Wallets and settlement | Dynamic wallet experience, Flow checkout lifecycle, Arc USDC settlement |
| User experience | iMessage, claim flow, OG payment cards, FaceID approval |
| Agent commerce | Server wallet flow, x402 paywall demo, autonomous action log |

## Review

All sponsor integrations and security-sensitive payment paths were reviewed by the team before submission.

## AI tool disclosure

The canonical, file-level AI-tool disclosure (required by ETHGlobal rules) lives at
the repo root: [`AI_ATTRIBUTION.md`](../AI_ATTRIBUTION.md). Summary: **Cursor**,
**Claude Code**, and **LingCode** were used to assist scaffolding, styling, docs,
and test runs; **OpenAI** powers only the optional Twilio Voice demo. Core payment
logic (NLP, orchestrator, escrow, contracts, SDK integrations) was human-authored
and reviewed. No AI voiceover is used in the demo video.
