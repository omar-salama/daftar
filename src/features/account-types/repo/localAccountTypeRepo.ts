import { RowId } from '@/kernel';
import { generateUuid, getJSON, nextVersion, outboxAppend, setJSON } from '@/lib/storage';
import { AccountTypeId, AccountTypeRepo, AccountTypeVersion, resolveAccountTypeCurrent } from '../model';

const KEY_ACCOUNT_TYPE_VERSIONS = 'account-types.versions';

function createSeedAccountType(id: string, name: string, order: number, isLiability: boolean = false): AccountTypeVersion {
  const { version, deviceId } = nextVersion();

  return {
    rowId: generateUuid() as RowId,
    accountTypeId: id as AccountTypeId,
    version,
    deviceId,
    isDeleted: false,
    name,
    order,
    isLiability,
  };
}

export const localAccountTypeRepo: AccountTypeRepo = {
  async listCurrent(): Promise<AccountTypeVersion[]> {
    let versions = getJSON<AccountTypeVersion[]>(KEY_ACCOUNT_TYPE_VERSIONS) ?? [];
    
    // Seed default account types on first open if empty
    if (versions.length === 0) {
      const seeds = [
        createSeedAccountType('cash', 'Cash', 0),
        createSeedAccountType('credit', 'Credit Card', 1, true),
        createSeedAccountType('bank', 'Bank Account', 2),
        createSeedAccountType('prepaid', 'Prepaid Card', 3),
        createSeedAccountType('savings', 'Savings', 4),
        createSeedAccountType('investment', 'Investment', 5),
        createSeedAccountType('others', 'Others', 6),
      ];
      
      versions = seeds;
      setJSON(KEY_ACCOUNT_TYPE_VERSIONS, versions);

      for (const seed of seeds) {
        outboxAppend(seed);
      }
    }

    return resolveAccountTypeCurrent(versions);
  },

  async append(v: AccountTypeVersion): Promise<void> {
    const versions = getJSON<AccountTypeVersion[]>(KEY_ACCOUNT_TYPE_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_ACCOUNT_TYPE_VERSIONS, versions);
    
    outboxAppend(v);
  }
};
