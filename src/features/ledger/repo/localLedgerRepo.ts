import { getJSON, setJSON, outboxAppend } from '@/lib/storage';
import { TxVersion, resolveCurrent } from '@/kernel';
import { LedgerRepo } from '../model';

const KEY_LEDGER_VERSIONS = 'ledger.versions';

export const localLedgerRepo: LedgerRepo = {
  async listCurrent(): Promise<TxVersion[]> {
    const versions = getJSON<TxVersion[]>(KEY_LEDGER_VERSIONS) ?? [];
    return resolveCurrent(versions);
  },

  async append(v: TxVersion): Promise<void> {
    const versions = getJSON<TxVersion[]>(KEY_LEDGER_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_LEDGER_VERSIONS, versions);
    
    // Append to sync outbox
    outboxAppend(v);
  }
};
