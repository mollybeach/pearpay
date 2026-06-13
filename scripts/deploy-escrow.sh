#!/usr/bin/env bash
# Deploy PearPayEscrow.sol to Arc Testnet.
# Requires FUNDER_PRIVATE_KEY or PRIVATE_KEY in .env (never commit).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="${HOME}/.foundry/bin:${PATH}"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' .env | sed 's/^/export /')
  set +a
fi

PK="${PRIVATE_KEY:-${FUNDER_PRIVATE_KEY:-}}"
if [ -z "$PK" ]; then
  echo "Set PRIVATE_KEY or FUNDER_PRIVATE_KEY in .env (funded Arc wallet)."
  exit 1
fi

export PRIVATE_KEY="$PK"
RPC="${ARC_RPC_URL:-https://rpc.testnet.arc.network}"

echo "Deploying PearPayEscrow to Arc Testnet ($RPC)..."
forge script contracts/script/DeployPearPayEscrow.s.sol \
  --rpc-url "$RPC" \
  --broadcast \
  -vvv

# Parse deployed address from broadcast artifact (latest run).
BROADCAST="broadcast/DeployPearPayEscrow.s.sol/5042002/run-latest.json"
if [ -f "$BROADCAST" ]; then
  ADDR=$(node -e "
    const j=require('./$BROADCAST');
    const tx=j.transactions?.find(t=>t.contractName==='PearPayEscrow');
    console.log(tx?.contractAddress||'');
  ")
  if [ -n "$ADDR" ]; then
    echo ""
    echo "Deployed PearPayEscrow: $ADDR"
    node scripts/update-env.mjs ARC_ESCROW_CONTRACT_ADDRESS "$ADDR"
    node scripts/update-env.mjs ESCROW_CONTRACT_ADDRESS "$ADDR"
    echo "Updated .env with ARC_ESCROW_CONTRACT_ADDRESS=$ADDR"
  fi
fi
