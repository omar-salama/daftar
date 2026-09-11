import { getJSON, setJSON, outboxAppend, nextVersion, generateUuid } from '@/lib/storage';
import { TxVersion, TxId, resolveCurrent, buildTxVersion, BuildTxVersionInput, RowId } from '@/kernel';
import { LedgerRepo } from '../model';

export function createTxVersion(input: Omit<BuildTxVersionInput, 'deviceId' | 'rowId' | 'txId'> & { txId?: TxId }): TxVersion {
  const { version, deviceId } = nextVersion();
  const rowId = generateUuid() as RowId;
  const { txId: inputTxId, ...rest } = input;
  const txId = inputTxId ?? (generateUuid() as TxId);

  return buildTxVersion({
    ...rest,
    txId,
    deviceId,
    rowId
  }, version);
}

const KEY_LEDGER_VERSIONS = 'ledger.versions';

export const localLedgerRepo: LedgerRepo = {
  async listCurrent(): Promise<TxVersion[]> {
    const versions = getJSON<TxVersion[]>(KEY_LEDGER_VERSIONS) ?? [];
    return resolveCurrent(versions);
  },

  async listAll(): Promise<TxVersion[]> {
    return getJSON<TxVersion[]>(KEY_LEDGER_VERSIONS) ?? [];
  },

  async append(v: TxVersion): Promise<void> {
    const versions = getJSON<TxVersion[]>(KEY_LEDGER_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_LEDGER_VERSIONS, versions);
    
    // Append to sync outbox
    outboxAppend(v);
  }
};
