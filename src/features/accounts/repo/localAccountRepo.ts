import { RowId } from '@/kernel';
import { generateUuid, getJSON, nextVersion, outboxAppend, setJSON } from '@/lib/storage';
import { AccountId, AccountRepo, AccountType, AccountVersion, resolveAccountCurrent } from '../model';

const KEY_ACCOUNT_VERSIONS = 'accounts.versions';

function createSeedAccount(name: string, type: AccountType, order: number): AccountVersion {
  const { version, deviceId } = nextVersion();

  return {
    rowId: generateUuid() as RowId,
    accountId: generateUuid() as AccountId,
    version,
    deviceId,
    isDeleted: false,
    name,
    type,
    order,
    currency: 'USD',
  };
}

export const localAccountRepo: AccountRepo = {
  async listCurrent(): Promise<AccountVersion[]> {
    let versions = getJSON<AccountVersion[]>(KEY_ACCOUNT_VERSIONS) ?? [];

    // Seed default accounts on first open if empty
    if (versions.length === 0) {
      const seed1 = createSeedAccount('Cash', 'cash', 0);
      const seed2 = createSeedAccount('Main', 'bank', 1);
      versions = [seed1, seed2];
      setJSON(KEY_ACCOUNT_VERSIONS, versions);

      outboxAppend(seed1);
      outboxAppend(seed2);
    }

    return resolveAccountCurrent(versions);
  },

  async append(v: AccountVersion): Promise<void> {
    const versions = getJSON<AccountVersion[]>(KEY_ACCOUNT_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_ACCOUNT_VERSIONS, versions);
    
    outboxAppend(v);
  }
};
