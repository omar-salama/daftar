import { Minor, addMinor } from './money';

export type TxId = string & { __brand: 'TxId' };
export type RowId = string & { __brand: 'RowId' };
export type TxType = 'expense' | 'income';

export interface TxLine {
  categoryId: string;
  amountMinor: Minor;
}

export interface TxVersion {
  rowId: RowId;
  txId: TxId;
  version: string;
  deviceId: string;
  type: TxType;
  isDeleted: boolean;
  occurredAt: string; // YYYY-MM-DD format
  accountId: string;
  transferAccountId?: string;
  payee?: string;
  note?: string;
  lines: TxLine[];
  totalMinor: Minor;
}

export interface BuildTxVersionInput {
  rowId: RowId;
  txId: TxId;
  deviceId: string;
  type?: TxType;
  isDeleted?: boolean;
  occurredAt: string;
  accountId: string;
  transferAccountId?: string;
  payee?: string;
  note?: string;
  lines: TxLine[];
}

export function buildTxVersion(input: BuildTxVersionInput, versionString: string): TxVersion {
  if (input.lines.length === 0 && !input.isDeleted) {
    throw new Error('buildTxVersion: Transaction must have at least one line');
  }

  let totalMinor = 0 as Minor;
  for (const line of input.lines) {
    if (!Number.isSafeInteger(line.amountMinor)) {
      throw new Error(`buildTxVersion: Unsafe integer in line amount: ${line.amountMinor}`);
    }
    totalMinor = addMinor(totalMinor, line.amountMinor);
  }

  return {
    rowId: input.rowId,
    txId: input.txId,
    version: versionString,
    deviceId: input.deviceId,
    type: input.type ?? 'expense',
    isDeleted: input.isDeleted ?? false,
    occurredAt: input.occurredAt,
    accountId: input.accountId,
    transferAccountId: input.transferAccountId,
    payee: input.payee,
    note: input.note,
    lines: input.lines,
    totalMinor,
  };
}

export function resolveCurrent(versions: TxVersion[]): TxVersion[] {
  const latestByTx = new Map<TxId, TxVersion>();

  for (const version of versions) {
    const existing = latestByTx.get(version.txId);
    
    // max(version) by string compare
    if (!existing || version.version > existing.version) {
      latestByTx.set(version.txId, version);
    }
  }

  // Drop tombstones
  const current: TxVersion[] = [];
  for (const version of latestByTx.values()) {
    if (!version.isDeleted) {
      current.push(version);
    }
  }

  return current;
}
