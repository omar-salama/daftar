import { RowId } from '@/kernel';

export type AccountTypeId = string & { __brand: 'AccountTypeId' };

export interface AccountTypeVersion {
  rowId: RowId;
  accountTypeId: AccountTypeId;
  version: string;
  deviceId: string;
  isDeleted: boolean;
  name: string;
  icon?: string;
  order?: number;
}

export interface AccountTypeRepo {
  listCurrent(): Promise<AccountTypeVersion[]>;
  append(v: AccountTypeVersion): Promise<void>;
}

export function resolveAccountTypeCurrent(versions: AccountTypeVersion[]): AccountTypeVersion[] {
  const latestByAccountType = new Map<AccountTypeId, AccountTypeVersion>();

  for (const version of versions) {
    const existing = latestByAccountType.get(version.accountTypeId);
    if (!existing || version.version > existing.version) {
      latestByAccountType.set(version.accountTypeId, version);
    }
  }

  const current: AccountTypeVersion[] = [];
  for (const version of latestByAccountType.values()) {
    if (!version.isDeleted) {
      current.push(version);
    }
  }

  return current;
}
