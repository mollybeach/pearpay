/**
 * End-to-end Arc escrow + claim verification on testnet.
 *
 * Usage:
 *   FUNDER_PRIVATE_KEY=0x... node scripts/arc-live-verify.mjs
 *   # or set FUNDER_PRIVATE_KEY in .env and run:
 *   node scripts/arc-live-verify.mjs
 *
 * Escrows 0.01 USDC, claims to a fresh random recipient, prints explorer URLs.
 */
import { randomBytes } from "node:crypto";
import { execSync } from "node:child_process";
import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  http,
  keccak256,
  stringToBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { waitForTransactionReceipt } from "viem/actions";
import { loadEnvFile, setEnvVar, root } from "./load-env.mjs";

loadEnvFile(".env");
loadEnvFile(".env.local");

const ARC_CHAIN_ID = 5042002;
const ARC_RPC = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
const ARC_USDC =
  process.env.ARC_USDC_ADDRESS ??
  "0x3600000000000000000000000000000000000000";
const EXPLORER =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

const pk = process.env.FUNDER_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
if (!pk) {
  console.error("Set FUNDER_PRIVATE_KEY (funded Arc wallet) in .env");
  process.exit(1);
}

const normalizedPk = pk.startsWith("0x") ? pk : `0x${pk}`;
const account = privateKeyToAccount(normalizedPk);

const arcTestnet = {
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC_RPC] } },
};

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_RPC),
});

const walletClient = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http(ARC_RPC),
});

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
];

const ESCROW_ABI = [
  {
    name: "escrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "paymentId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "expiresAt", type: "uint64" },
      { name: "claimHash", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "claim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "paymentId", type: "bytes32" },
      { name: "secret", type: "bytes32" },
      { name: "recipient", type: "address" },
    ],
    outputs: [],
  },
];

function txUrl(hash) {
  return `${EXPLORER.replace(/\/$/, "")}/tx/${hash}`;
}

async function deployContract() {
  console.log("No ARC_ESCROW_CONTRACT_ADDRESS — deploying via forge...");
  execSync("bash scripts/deploy-escrow.sh", { cwd: root, stdio: "inherit" });
  loadEnvFile(".env");
  const addr = process.env.ARC_ESCROW_CONTRACT_ADDRESS;
  if (!addr) throw new Error("Deploy finished but contract address missing");
  return addr;
}

async function main() {
  let contract =
    process.env.ARC_ESCROW_CONTRACT_ADDRESS ??
    process.env.ESCROW_CONTRACT_ADDRESS;

  if (!contract) {
    contract = await deployContract();
  }

  const balance = await publicClient.readContract({
    address: ARC_USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log(`Funder ${account.address} USDC balance: ${balance}`);

  const amount = 10_000n; // 0.01 USDC (6 decimals)
  if (balance < amount) {
    throw new Error(`Need at least ${amount} base units USDC on Arc testnet`);
  }

  const paymentId = `pay_verify_${Date.now()}`;
  const onChainPaymentId = keccak256(stringToBytes(paymentId));
  const claimSecret = `0x${randomBytes(32).toString("hex")}`;
  const claimHash = keccak256(encodePacked(["bytes32"], [claimSecret]));
  const expiresAt = BigInt(Math.floor(Date.now() / 1000) + 7 * 86400);
  const recipient = privateKeyToAccount(
    `0x${randomBytes(32).toString("hex")}`,
  ).address;

  const allowance = await publicClient.readContract({
    address: ARC_USDC,
    abi: [
      {
        name: "allowance",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
        ],
        outputs: [{ type: "uint256" }],
      },
    ],
    functionName: "allowance",
    args: [account.address, contract],
  });

  if (allowance < amount) {
    const approveHash = await walletClient.writeContract({
      address: ARC_USDC,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [contract, amount],
    });
    await waitForTransactionReceipt(publicClient, { hash: approveHash });
    console.log(`Approved USDC: ${txUrl(approveHash)}`);
  }

  const escrowHash = await walletClient.writeContract({
    address: contract,
    abi: ESCROW_ABI,
    functionName: "escrow",
    args: [onChainPaymentId, ARC_USDC, amount, expiresAt, claimHash],
  });
  await waitForTransactionReceipt(publicClient, { hash: escrowHash });
  console.log(`\n✅ escrow() tx: ${escrowHash}`);
  console.log(`   ${txUrl(escrowHash)}`);

  const claimHashTx = await walletClient.writeContract({
    address: contract,
    abi: ESCROW_ABI,
    functionName: "claim",
    args: [onChainPaymentId, claimSecret, recipient],
  });
  await waitForTransactionReceipt(publicClient, { hash: claimHashTx });
  console.log(`\n✅ claim() tx: ${claimHashTx}`);
  console.log(`   ${txUrl(claimHashTx)}`);

  setEnvVar("ARC_ESCROW_CONTRACT_ADDRESS", contract);
  setEnvVar("ESCROW_CONTRACT_ADDRESS", contract);

  console.log("\nArc escrow live verification complete.");
  console.log(`Contract: ${contract}`);
  console.log(`Recipient: ${recipient}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
