import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { getEnv } from "@/lib/env";

export interface FlowSessionRecord {
  transaction_id: string;
  session_token: string;
  intent_id: string;
  amount: number;
  recipient: string;
  checkout_id: string;
  settlement?: Record<string, unknown>;
  status?: string;
  created_at: number;
}

interface FlowStoreData {
  byIntent: Record<string, FlowSessionRecord>;
  byTransaction: Record<string, string>;
}

const DEFAULT_PATH = path.join(process.cwd(), ".flow-store.json");

function storePath(): string {
  return getEnv().FLOW_STORE_PATH ?? DEFAULT_PATH;
}

function emptyStore(): FlowStoreData {
  return { byIntent: {}, byTransaction: {} };
}

function loadStore(): FlowStoreData {
  const file = storePath();
  if (!existsSync(file)) return emptyStore();
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as Partial<FlowStoreData>;
    return {
      byIntent: raw.byIntent ?? {},
      byTransaction: raw.byTransaction ?? {},
    };
  } catch {
    return emptyStore();
  }
}

function saveStore(data: FlowStoreData): void {
  const file = storePath();
  const dir = path.dirname(file);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

export function saveFlowSession(record: FlowSessionRecord): void {
  const store = loadStore();
  store.byIntent[record.intent_id] = record;
  store.byTransaction[record.transaction_id] = record.intent_id;
  saveStore(store);
}

export function getFlowSessionByIntent(
  intentId: string,
): FlowSessionRecord | undefined {
  return loadStore().byIntent[intentId];
}

export function getFlowSessionByTransaction(
  transactionId: string,
): FlowSessionRecord | undefined {
  const store = loadStore();
  const intentId = store.byTransaction[transactionId];
  return intentId ? store.byIntent[intentId] : undefined;
}

export function updateFlowSession(
  intentId: string,
  patch: Partial<FlowSessionRecord>,
): FlowSessionRecord | undefined {
  const store = loadStore();
  const existing = store.byIntent[intentId];
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  store.byIntent[intentId] = updated;
  saveStore(store);
  return updated;
}

export function updateFlowSessionByTransaction(
  transactionId: string,
  patch: Partial<FlowSessionRecord>,
): FlowSessionRecord | undefined {
  const store = loadStore();
  const intentId = store.byTransaction[transactionId];
  if (!intentId) return undefined;
  return updateFlowSession(intentId, patch);
}

/** Test helper — reset persisted sessions. */
export function clearFlowStore(): void {
  saveStore(emptyStore());
}
