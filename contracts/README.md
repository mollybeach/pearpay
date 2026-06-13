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
- **Stablecoin-native** — works with any ERC-20, targeting Arc USDC
  (`0x3600000000000000000000000000000000000000`) and Arc Testnet EURC
  (`0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`).

### Lifecycle

```
escrow()  → Escrowed
          ├── claim(secret)   → Claimed   (funds → recipient)
          ├── refund()        → Refunded  (after expiry, funds → sender)
          └── cancel()        → Cancelled (before expiry, funds → sender)
```

### ETHGlobal — Arc Track

This contract targets *Best Smart Contracts on Arc with Advanced Stablecoin
Logic* (conditional flows, onchain automation, multi-step USDC/EURC settlement).

## Foundry

From the repository root:

```bash
forge test
```

The test suite covers escrow, claim, wrong secret, refund after expiry, sender
cancel, double-claim rejection, and non-sender cancel rejection using a mock
ERC-20 stablecoin.

### Deploy

Deploy with Foundry once the target RPC and deployer key are configured:

```bash
PRIVATE_KEY=... forge script contracts/script/DeployPearPayEscrow.s.sol \
  --rpc-url "$ARC_RPC_URL" --broadcast
```

- **Arc / EVM** — deploy against an Arc RPC; the backend references the address
  via `ARC_ESCROW_CONTRACT_ADDRESS` or `ESCROW_CONTRACT_ADDRESS`.

The `paymentId` used in `escrow()` matches the off-chain `payment.id`. Pear Pay
routes non-private claimable payments through Arc as the USDC liquidity hub.
