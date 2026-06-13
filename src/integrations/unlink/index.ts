import { assertConfiguredForProduction, getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { formatUsdc, type UsdcAmount } from "@/lib/money";

const log = logger.scoped("unlink");

/**
 * Unlink integration — embedded privacy SDK (@unlink-xyz/sdk).
 *
 * When a user requests a private transfer, funds are routed through Unlink's
 * private primitives so balances, amounts, and counterparties stay hidden.
 * Core primitives: deposit(), transfer(), withdraw(), execute().
 */

export interface PrivateTransferRequest {
  fromAddress: `0x${string}`;
  toAddress: `0x${string}`;
  amount: UsdcAmount;
  chainId: number;
}

export interface PrivateTransferReceipt {
  /** Opaque private-transfer handle; reveals nothing about amount or parties. */
  noteId: string;
  status: "shielded" | "settled";
}

function isConfigured(): boolean {
  return Boolean(getEnv().UNLINK_API_KEY);
}

function requireConfigured() {
  const configured = isConfigured();
  assertConfiguredForProduction("unlink", configured);
  return configured;
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getEnv().UNLINK_API_KEY ?? ""}`,
  };
}

/** Shield funds into a private balance (Unlink `deposit()`). */
export async function deposit(
  fromAddress: `0x${string}`,
  amount: UsdcAmount,
  chainId: number,
): Promise<{ noteId: string }> {
  if (!requireConfigured()) {
    return { noteId: `note_${fromAddress.slice(2, 10)}_${amount}` };
  }
  const res = await fetch("https://api.unlink.xyz/v1/deposit", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      address: fromAddress,
      amount: formatUsdc(amount),
      chainId,
    }),
  });
  if (!res.ok) throw new Error(`Unlink deposit failed: ${res.status}`);
  return (await res.json()) as { noteId: string };
}

/**
 * Privately transfer USDC between accounts (Unlink `transfer()`). Amounts and
 * counterparties are confidential.
 */
export async function privateTransfer(
  req: PrivateTransferRequest,
): Promise<PrivateTransferReceipt> {
  if (!requireConfigured()) {
    log.debug("unlink local private transfer", {
      amount: formatUsdc(req.amount),
    });
    return {
      noteId: `note_${req.fromAddress.slice(2, 8)}${req.toAddress.slice(2, 8)}`,
      status: "shielded",
    };
  }

  const res = await fetch("https://api.unlink.xyz/v1/transfer", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      from: req.fromAddress,
      to: req.toAddress,
      amount: formatUsdc(req.amount),
      chainId: req.chainId,
    }),
  });
  if (!res.ok) throw new Error(`Unlink transfer failed: ${res.status}`);

  const data = (await res.json()) as { noteId: string; status: string };
  log.info("unlink private transfer complete", { noteId: data.noteId });
  return {
    noteId: data.noteId,
    status: data.status === "settled" ? "settled" : "shielded",
  };
}

/** Withdraw a private balance back to a public address (Unlink `withdraw()`). */
export async function withdraw(
  noteId: string,
  toAddress: `0x${string}`,
): Promise<{ txHash: `0x${string}` }> {
  if (!requireConfigured()) {
    return {
      txHash: `0x${Buffer.from(noteId).toString("hex").padEnd(64, "0").slice(0, 64)}` as `0x${string}`,
    };
  }
  const res = await fetch("https://api.unlink.xyz/v1/withdraw", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ noteId, to: toAddress }),
  });
  if (!res.ok) throw new Error(`Unlink withdraw failed: ${res.status}`);
  return (await res.json()) as { txHash: `0x${string}` };
}
