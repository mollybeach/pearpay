# AI Tool Attribution — Pear Pay 🍐 (ETHGlobal NYC 2026)

Per ETHGlobal's submission rules, this document discloses **exactly where and how
AI tools were used** in Pear Pay, down to the directory/file level. AI was used to
**assist** development — scaffolding, styling, docs, and refactors — not to author
the project. Every payment-critical path was written or reviewed by a human team
member before submission.

## Team (human authors)

- **Molly Beach** — product architecture, NLP parser, payment orchestrator, escrow,
  messaging channels, iOS/iMessage extension, and Solidity contracts.
- **Priyansh Shah** — Fireblocks Flow integration, WebAuthn/FaceID, OG pay-link flow,
  Dynamic wallet UI, and the agent x402 demo.

## AI tools used

| Tool | Role in this project |
|------|----------------------|
| **Cursor** (Pro) | Inline code completion + refactors while writing TypeScript/React; scaffolding Next.js pages and Tailwind styling. |
| **Claude Code** | Documentation consolidation, submission-prep review, and repo hygiene (this attribution file, README/Submission cross-checks). |
| **LingCode** | Terminal-native backend automation and running the test suite during development. |
| **OpenAI** | Optional Twilio Voice demo path only — interprets a spoken intent ("Send Alex twenty dollars"). Not used in the core NLP parser. |

No AI **voiceover/TTS** is used in the demo video, and no AI-generated code was
merged without human review.

## File-level disclosure

### Human-authored core (AI used only for minor completion/refactor)
These contain the payment-critical logic and were written and reviewed by the team:

- `contracts/PearPayEscrow.sol` — programmable USDC/EURC escrow (claim-secret release,
  time-based refund, sender cancel) and its Foundry tests in `contracts/test/`.
- `src/core/nlp/` — rule-based natural-language → `PaymentIntent` parser.
- `src/core/payments/` — orchestrator, settlement/rail selection, JSON serialization.
- `src/core/recipients/`, `src/core/senders/`, `src/core/escrow/` — recipient
  resolution and escrow service/store.
- `src/integrations/` — Dynamic, Arc, Unlink, Flow, Twilio, WebAuthn SDK wiring.
  SDK calls were hand-written against vendor docs; AI assisted with boilerplate
  and types. All were manually tested against live/sandbox endpoints.

### AI-assisted (scaffolding + styling, then human-reviewed)
- `app/` — Next.js App Router pages and API route scaffolding.
- `src/components/` — React UI components and the messaging Simulator.
- Tailwind CSS styling throughout (`tailwind.config.ts`, component classNames).

### AI-assisted documentation
- `README.md`, `docs/*.md` (Submission, JUDGING, bounty briefs), and this file —
  drafted/edited with AI assistance, fact-checked by the team against the code.

## Spec-driven / planning artifacts
Pear Pay did **not** use a formal spec-driven framework (OpenSpec / Kiro / spec-kit).
Human-authored planning artifacts that directed the build are included in the repo:
`docs/PHASES.md`, `docs/FINISH_PLAN.md`, `docs/PROJECT_HISTORY.md`, and
`docs/HUMAN_CHECKLIST.md`.

## Verification
Progress is visible in the git history (incremental commits across the event, two
contributors). Core logic has tests: `npm test` (vitest) and
`npm run test:contracts` (Foundry).
