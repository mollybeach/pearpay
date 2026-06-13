# Pear Pay Contracts

Smart contracts powering Pear Pay's claimable payments, deployed on **Arc**
(Circle's purpose-built L1) and any EVM-compatible chain.

## PearPayEscrow.sol

A programmable escrow implementing the Smart Escrow System from the root README:

- **Conditional release** — funds release only when the recipient presents the
  claim secret (`keccak256(secret) == claimHash`).
- **Time-based auto-refund** — anyone can refund an expired, unclaimed payment
  back to the sender.
- **Sender cancellation** — the sender can cancel before expiry.
- **Multi-step settlement** — escrow on send, release on claim.
- **Stablecoin-native** — works with any ERC-20, targeting USDC and EURC.

### Lifecycle

```
escrow()  → Escrowed
          ├── claim(secret)   → Claimed   (funds → recipient)
          ├── refund()        → Refunded  (after expiry, funds → sender)
          └── cancel()        → Cancelled (before expiry, funds → sender)
```

### ETHGlobal — Arc & Hedera Tracks

This contract targets *Best Smart Contracts on Arc with Advanced Stablecoin
Logic* (conditional flows, onchain automation, multi-step USDC/EURC settlement)
**and** *Best Use of Hedera Smart Contracts* — the same bytecode deploys to
Hedera's Smart Contract Service via the JSON-RPC relay.

### Deploy

Compile and deploy with your tool of choice (Foundry / Hardhat):

- **Arc / EVM** — deploy against an Arc RPC; the backend references the address
  via `ARC_RPC_URL`.
- **Hedera EVM** — deploy against the Hedera JSON-RPC relay
  (`https://testnet.hashio.io/api`, chain id `296` testnet / `295` mainnet).

The `paymentId` used in `escrow()` matches the off-chain `payment.id`, and every
escrow/claim is mirrored to a Hedera Consensus Service (HCS) topic for a
tamper-proof audit trail.
