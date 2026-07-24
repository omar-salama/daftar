import { MMKV } from 'react-native-mmkv';
import { type HLCState } from '@/kernel';
import type { TxVersion } from '@/kernel';

// ---------------------------------------------------------------------------
// Single shared MMKV instance
// ---------------------------------------------------------------------------

export const storage = new MMKV({ id: 'daftar-storage' });

// ---------------------------------------------------------------------------
// Key prefixes (RULES.md §5)
// ---------------------------------------------------------------------------

const PREFIX_RQ = 'rq.';
const PREFIX_OUTBOX = 'outbox.';
const PREFIX_META = 'meta.';

const KEY_OUTBOX = `${PREFIX_OUTBOX}rows`;
const KEY_DEVICE_ID = `${PREFIX_META}deviceId`;
const KEY_HLC_STATE = `${PREFIX_META}hlcState`;
const KEY_LAST_PULLED_AT = `${PREFIX_META}lastPulledAt`;

// ---------------------------------------------------------------------------
// Generic typed JSON helpers
// ---------------------------------------------------------------------------

export function getJSON<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  if (raw === undefined) return undefined;
  return JSON.parse(raw) as T;
}

export function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// TanStack Query MMKV persister adapter (synchronous)
// Used by queryClient.ts to satisfy the `StoragePersisterOptions` interface.
// ---------------------------------------------------------------------------

export const rqStorage = {
  getItem: (key: string): string | undefined | null => {
    return storage.getString(`${PREFIX_RQ}${key}`);
  },
  setItem: (key: string, value: string): void => {
    storage.set(`${PREFIX_RQ}${key}`, value);
  },
  removeItem: (key: string): void => {
    storage.delete(`${PREFIX_RQ}${key}`);
  },
};

// ---------------------------------------------------------------------------
// Outbox — append-only queue of pending TxVersion rows awaiting sync push
// ---------------------------------------------------------------------------

export function outboxAppend(row: TxVersion): void {
  const current = getJSON<TxVersion[]>(KEY_OUTBOX) ?? [];
  current.push(row);
  setJSON(KEY_OUTBOX, current);
}

export function outboxPeekAll(): readonly TxVersion[] {
  return getJSON<TxVersion[]>(KEY_OUTBOX) ?? [];
}

export function outboxRemove(rowIds: ReadonlyArray<string>): void {
  const current = getJSON<TxVersion[]>(KEY_OUTBOX) ?? [];
  const idSet = new Set(rowIds);
  const remaining = current.filter((row) => !idSet.has(row.rowId));
  setJSON(KEY_OUTBOX, remaining);
}

// ---------------------------------------------------------------------------
// Meta — deviceId (generated once, persisted forever)
// ---------------------------------------------------------------------------

export function generateUuid(): string {
  // RFC 4122 v4 UUID — crypto.randomUUID() is available in Hermes / RN 0.73+
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: manual v4 UUID with Math.random (acceptable for a device-id, not for security)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  const existing = storage.getString(KEY_DEVICE_ID);
  if (existing !== undefined) return existing;
  const id = generateUuid();
  storage.set(KEY_DEVICE_ID, id);
  return id;
}

// ---------------------------------------------------------------------------
// Meta — persisted HLC state (lastMillis + counter)
// ---------------------------------------------------------------------------

const DEFAULT_HLC_STATE: HLCState = { lastMillis: 0, counter: 0 };

export function getHlcState(): HLCState {
  return getJSON<HLCState>(KEY_HLC_STATE) ?? DEFAULT_HLC_STATE;
}

export function setHlcState(state: HLCState): void {
  setJSON(KEY_HLC_STATE, state);
}

// ---------------------------------------------------------------------------
// Meta — last-pulled-at cursor (ISO timestamp string, server clock)
// ---------------------------------------------------------------------------

export function getLastPulledAt(): string | undefined {
  return storage.getString(KEY_LAST_PULLED_AT);
}

export function setLastPulledAt(isoTimestamp: string): void {
  storage.set(KEY_LAST_PULLED_AT, isoTimestamp);
}
