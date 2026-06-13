import { randomBytes } from "node:crypto";
import {
  encodePacked,
  keccak256,
  stringToBytes,
  type Hash,
  type Hex,
} from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { ERC20_ABI, PEARPAY_ESCROW_ABI } from "./abi";
import {
  getArcPublicClient,
  getArcWalletClient,
  getEscrowContractAddress,
  isArcEscrowLive,
} from "./client";
import { arcExplorerTxUrl } from "./chain";
import { ARC_USDC_ADDRESS, getArcNetworkConfig } from "./config";
import { logger } from "@/lib/logger";
import type { UsdcAmount } from "@/lib/money";

const log = logger.scoped("arc:escrow");

export interface OnChainEscrowParams {
  paymentId: string;
  amount: UsdcAmount;
  expiresAtMs: number;
}

export interface OnChainEscrowResult {
  onChainPaymentId: `0x${string}`;
  claimSecret: `0x${string}`;
  claimHash: `0x${string}`;
  escrowTxHash: `0x${string}`;
  explorerUrl: string;
}

export interface OnChainClaimParams {
  onChainPaymentId: `0x${string}`;
  claimSecret: `0x${string}`;
  recipient: `0x${string}`;
}

export interface OnChainClaimResult {
  claimTxHash: `0x${string}`;
  explorerUrl: string;
}

/** Map backend payment id to the bytes32 key used on-chain. */
export function paymentIdToBytes32(paymentId: string): `0x${string}` {
  return keccak256(stringToBytes(paymentId));
}

/** Generate a claim secret and its on-chain hash (keccak256(abi.encodePacked(secret))). */
export function generateClaimCredentials(): {
  claimSecret: `0x${string}`;
  claimHash: `0x${string}`;
} {
  const claimSecret = `0x${randomBytes(32).toString("hex")}` as `0x${string}`;
  const claimHash = keccak256(
    encodePacked(["bytes32"], [claimSecret]),
  ) as `0x${string}`;
  return { claimSecret, claimHash };
}

async function ensureUsdcApproval(
  token: `0x${string}`,
  spender: `0x${string}`,
  amount: UsdcAmount,
): Promise<void> {
  const publicClient = getArcPublicClient();
  const walletClient = getArcWalletClient();
  const [account] = await walletClient.getAddresses();

  const allowance = await publicClient.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account!, spender],
  });

  if (allowance >= amount) return;

  const approveHash = await walletClient.writeContract({
    account: account!,
    address: token,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [spender, amount],
    chain: null,
  });
  await waitForTransactionReceipt(publicClient, { hash: approveHash });
}

/** Escrow USDC into PearPayEscrow on Arc Testnet. */
export async function escrowOnChain(
  params: OnChainEscrowParams,
): Promise<OnChainEscrowResult> {
  if (!isArcEscrowLive()) {
    throw new Error("Arc escrow is not configured (FUNDER_PRIVATE_KEY + contract address)");
  }

  const contract = getEscrowContractAddress()!;
  const token = ARC_USDC_ADDRESS;
  const onChainPaymentId = paymentIdToBytes32(params.paymentId);
  const { claimSecret, claimHash } = generateClaimCredentials();
  const expiresAt = BigInt(Math.floor(params.expiresAtMs / 1000));

  await ensureUsdcApproval(token, contract, params.amount);

  const publicClient = getArcPublicClient();
  const walletClient = getArcWalletClient();
  const [account] = await walletClient.getAddresses();

  const escrowTxHash = await walletClient.writeContract({
    account: account!,
    address: contract,
    abi: PEARPAY_ESCROW_ABI,
    functionName: "escrow",
    args: [onChainPaymentId, token, params.amount, expiresAt, claimHash],
    chain: null,
  });

  await waitForTransactionReceipt(publicClient, { hash: escrowTxHash });

  const config = getArcNetworkConfig();
  log.info("on-chain escrow confirmed", {
    paymentId: params.paymentId,
    txHash: escrowTxHash,
  });

  return {
    onChainPaymentId,
    claimSecret,
    claimHash,
    escrowTxHash,
    explorerUrl: arcExplorerTxUrl(escrowTxHash, config.explorerUrl),
  };
}

/** Claim escrowed USDC on Arc — anyone can submit the secret + recipient. */
export async function claimOnChain(
  params: OnChainClaimParams,
): Promise<OnChainClaimResult> {
  if (!isArcEscrowLive()) {
    throw new Error("Arc escrow is not configured");
  }

  const contract = getEscrowContractAddress()!;
  const publicClient = getArcPublicClient();
  const walletClient = getArcWalletClient();
  const [account] = await walletClient.getAddresses();

  const claimTxHash = await walletClient.writeContract({
    account: account!,
    address: contract,
    abi: PEARPAY_ESCROW_ABI,
    functionName: "claim",
    args: [params.onChainPaymentId, params.claimSecret, params.recipient],
    chain: null,
  });

  await waitForTransactionReceipt(publicClient, { hash: claimTxHash });

  const config = getArcNetworkConfig();
  log.info("on-chain claim confirmed", { txHash: claimTxHash });

  return {
    claimTxHash,
    explorerUrl: arcExplorerTxUrl(claimTxHash, config.explorerUrl),
  };
}

export async function cancelOnChain(
  onChainPaymentId: `0x${string}`,
): Promise<Hash> {
  const contract = getEscrowContractAddress()!;
  const publicClient = getArcPublicClient();
  const walletClient = getArcWalletClient();
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    account: account!,
    address: contract,
    abi: PEARPAY_ESCROW_ABI,
    functionName: "cancel",
    args: [onChainPaymentId],
    chain: null,
  });
  await waitForTransactionReceipt(publicClient, { hash });
  return hash;
}

export async function refundOnChain(
  onChainPaymentId: `0x${string}`,
): Promise<Hash> {
  const contract = getEscrowContractAddress()!;
  const publicClient = getArcPublicClient();
  const walletClient = getArcWalletClient();
  const [account] = await walletClient.getAddresses();

  const hash = await walletClient.writeContract({
    account: account!,
    address: contract,
    abi: PEARPAY_ESCROW_ABI,
    functionName: "refund",
    args: [onChainPaymentId],
    chain: null,
  });
  await waitForTransactionReceipt(publicClient, { hash });
  return hash;
}

/** Direct USDC transfer on Arc (instant settlement path). */
export async function transferUsdcOnArc(
  toAddress: `0x${string}`,
  amount: UsdcAmount,
): Promise<{ txHash: `0x${string}`; explorerUrl: string }> {
  const publicClient = getArcPublicClient();
  const walletClient = getArcWalletClient();
  const [account] = await walletClient.getAddresses();

  const txHash = await walletClient.writeContract({
    account: account!,
    address: ARC_USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [toAddress, amount],
    chain: null,
  });

  await waitForTransactionReceipt(publicClient, { hash: txHash });
  const config = getArcNetworkConfig();

  return {
    txHash,
    explorerUrl: arcExplorerTxUrl(txHash, config.explorerUrl),
  };
}

export { isArcEscrowLive };
