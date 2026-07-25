import { nextHLC, RowId } from '@/kernel';
import { generateUuid, getDeviceId, getHlcState, getJSON, outboxAppend, setHlcState, setJSON } from '@/lib/storage';
import { AccountId, AccountRepo, AccountType, AccountVersion, resolveAccountCurrent } from '../model';

const KEY_ACCOUNT_VERSIONS = 'accounts.versions';

function createSeedAccount(name: string, type: AccountType, order: number, now: number): AccountVersion {
  const deviceId = getDeviceId();
  const state = getHlcState();
  const [version, newState] = nextHLC(now, state, deviceId);
  setHlcState(newState);

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
      const now = Date.now();
      const seed1 = createSeedAccount('Cash', 'cash', 0, now);
      const seed2 = createSeedAccount('Main', 'bank', 1, now);
      versions = [seed1, seed2];
      setJSON(KEY_ACCOUNT_VERSIONS, versions);
      
      // @ts-expect-error - The sync engine outbox accepts all versions but is typed to TxVersion for now.
      outboxAppend(seed1);
      // @ts-expect-error - outbox accepts all versions but typed to TxVersion for now.
      outboxAppend(seed2);
    }

    return resolveAccountCurrent(versions);
  },

  async append(v: AccountVersion): Promise<void> {
    const versions = getJSON<AccountVersion[]>(KEY_ACCOUNT_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_ACCOUNT_VERSIONS, versions);
    
    // @ts-expect-error - outbox accepts all versions but typed to TxVersion for now.
    outboxAppend(v);
  }
};
