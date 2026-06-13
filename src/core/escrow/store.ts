import type { ClaimablePayment } from "./types";

/**
 * Pluggable persistence for claimable payments.
 *
 * The default implementation is an in-memory store so the hackathon MVP runs
 * with zero infrastructure. Production swaps in a Postgres/KV-backed store that
 * satisfies the same interface.
 */
export interface EscrowStore {
  save(payment: ClaimablePayment): Promise<void>;
  getById(id: string): Promise<ClaimablePayment | null>;
  getByToken(claimToken: string): Promise<ClaimablePayment | null>;
  listExpired(now: number): Promise<ClaimablePayment[]>;
}

class InMemoryEscrowStore implements EscrowStore {
  private byId = new Map<string, ClaimablePayment>();
  private tokenToId = new Map<string, string>();

  async save(payment: ClaimablePayment): Promise<void> {
    this.byId.set(payment.id, payment);
    this.tokenToId.set(payment.claimToken, payment.id);
  }

  async getById(id: string): Promise<ClaimablePayment | null> {
    return this.byId.get(id) ?? null;
  }

  async getByToken(claimToken: string): Promise<ClaimablePayment | null> {
    const id = this.tokenToId.get(claimToken);
    return id ? (this.byId.get(id) ?? null) : null;
  }

  async listExpired(now: number): Promise<ClaimablePayment[]> {
    return [...this.byId.values()].filter(
      (p) => p.status === "escrowed" && p.expiresAt <= now,
    );
  }
}

let store: EscrowStore = new InMemoryEscrowStore();

export function getEscrowStore(): EscrowStore {
  return store;
}

/** Override the store (used by tests and production wiring). */
export function setEscrowStore(next: EscrowStore): void {
  store = next;
}
