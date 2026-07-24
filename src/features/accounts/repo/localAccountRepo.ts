import { getJSON, setJSON, outboxAppend } from '@/lib/storage';
import { AccountVersion, AccountRepo, resolveAccountCurrent } from '../model';

const KEY_ACCOUNT_VERSIONS = 'accounts.versions';

export const localAccountRepo: AccountRepo = {
  async listCurrent(): Promise<AccountVersion[]> {
    const versions = getJSON<AccountVersion[]>(KEY_ACCOUNT_VERSIONS) ?? [];
    return resolveAccountCurrent(versions);
  },

  async append(v: AccountVersion): Promise<void> {
    const versions = getJSON<AccountVersion[]>(KEY_ACCOUNT_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_ACCOUNT_VERSIONS, versions);
    
    // @ts-expect-error - The sync engine outbox accepts all versions (tx, account, category) but is typed to TxVersion for now.
    outboxAppend(v);
  }
};
