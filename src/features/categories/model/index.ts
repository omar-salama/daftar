import { RowId } from '@/kernel';

export type CategoryId = string & { __brand: 'CategoryId' };

export type CategoryType = 'expense' | 'income';

export interface CategoryVersion {
  rowId: RowId;
  categoryId: CategoryId;
  version: string;
  deviceId: string;
  isDeleted: boolean;
  name: string;
  icon: string;
  type: CategoryType;
  parentId?: string;
  order?: number;
}

export interface CategoryRepo {
  listCurrent(): Promise<CategoryVersion[]>;
  append(v: CategoryVersion): Promise<void>;
}

export function resolveCategoryCurrent(versions: CategoryVersion[]): CategoryVersion[] {
  const latestByCategory = new Map<CategoryId, CategoryVersion>();

  for (const version of versions) {
    const existing = latestByCategory.get(version.categoryId);
    if (!existing || version.version > existing.version) {
      latestByCategory.set(version.categoryId, version);
    }
  }

  const current: CategoryVersion[] = [];
  for (const version of latestByCategory.values()) {
    if (!version.isDeleted) {
      current.push(version);
    }
  }

  return current;
}
