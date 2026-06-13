import { verifyMessage } from "viem";

export interface X402PaymentProof {
  wallet: `0x${string}`;
  signature: `0x${string}`;
  message: string;
  amount: number;
  url: string;
}

export function buildX402Message(url: string, amount: number): string {
  return `PearPay:x402:${url}:${amount}`;
}

export function encodeX402Payment(proof: X402PaymentProof): string {
  return Buffer.from(JSON.stringify(proof)).toString("base64url");
}

export function decodeX402Payment(header: string): X402PaymentProof | null {
  try {
    const json = Buffer.from(header, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as X402PaymentProof;
    if (!parsed.wallet || !parsed.signature || !parsed.message) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function verifyX402Payment(header: string): Promise<boolean> {
  const proof = decodeX402Payment(header);
  if (!proof) return false;
  const expected = buildX402Message(proof.url, proof.amount);
  if (proof.message !== expected) return false;
  return verifyMessage({
    address: proof.wallet,
    message: proof.message,
    signature: proof.signature,
  });
}
