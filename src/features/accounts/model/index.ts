import { RowId } from '@/kernel';

export type AccountId = string & { __brand: 'AccountId' };

export type AccountType = 'cash' | 'credit' | 'bank' | 'prepaid' | 'savings' | 'investment' | 'others';

export interface AccountVersion {
  rowId: RowId;
  accountId: AccountId;
  version: string;
  deviceId: string;
  isDeleted: boolean;
  name: string;
  type: AccountType;
  order: number;
  currency: string;
  note?: string;
  initialBalance?: number;
  createdAt?: string;
}

export interface AccountRepo {
  listCurrent(): Promise<AccountVersion[]>;
  append(v: AccountVersion): Promise<void>;
}

export function resolveAccountCurrent(versions: AccountVersion[]): AccountVersion[] {
  const latestByAccount = new Map<AccountId, AccountVersion>();

  for (const version of versions) {
    const existing = latestByAccount.get(version.accountId);
    if (!existing || version.version > existing.version) {
      latestByAccount.set(version.accountId, version);
    }
  }

  const current: AccountVersion[] = [];
  for (const version of latestByAccount.values()) {
    if (!version.isDeleted) {
      current.push(version);
    }
  }

  return current;
}
