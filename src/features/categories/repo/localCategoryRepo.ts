import { nextHLC, RowId } from '@/kernel';
import { generateUuid, getDeviceId, getHlcState, getJSON, outboxAppend, setHlcState, setJSON } from '@/lib/storage';
import { CategoryId, CategoryRepo, CategoryType, CategoryVersion, resolveCategoryCurrent } from '../model';

const KEY_CATEGORY_VERSIONS = 'categories.versions';

function createSeedCategory(id: string, name: string, icon: string, type: CategoryType, now: number, order: number): CategoryVersion {
  const deviceId = getDeviceId();
  const state = getHlcState();
  const [version, newState] = nextHLC(now, state, deviceId);
  setHlcState(newState);

  return {
    rowId: generateUuid() as RowId,
    categoryId: id as CategoryId,
    version,
    deviceId,
    isDeleted: false,
    name,
    icon,
    type,
    order,
  };
}

export const localCategoryRepo: CategoryRepo = {
  async listCurrent(): Promise<CategoryVersion[]> {
    let versions = getJSON<CategoryVersion[]>(KEY_CATEGORY_VERSIONS) ?? [];
    
    // Seed default categories on first open if empty
    if (versions.length === 0) {
      const now = Date.now();
      
      const seeds = [
        createSeedCategory('cat-1', 'Groceries', '🛒', 'expense', now, 0),
        createSeedCategory('cat-2', 'Dining', '🍽', 'expense', now, 1),
        createSeedCategory('cat-3', 'Transport', '🚕', 'expense', now, 2),
        createSeedCategory('cat-4', 'Coffee', '☕️', 'expense', now, 3),
        createSeedCategory('cat-5', 'Shopping', '🛍', 'expense', now, 4),
        createSeedCategory('cat-6', 'Bills', '💡', 'expense', now, 5),
        createSeedCategory('cat-7', 'Entertainment', '🎬', 'expense', now, 6),
        createSeedCategory('inc-1', 'Salary', '💰', 'income', now, 0),
        createSeedCategory('inc-2', 'Other', '💵', 'income', now, 1),
      ];
      
      versions = seeds;
      setJSON(KEY_CATEGORY_VERSIONS, versions);
      
      for (const seed of seeds) {
        // @ts-expect-error - outbox accepts all versions but typed to TxVersion for now.
        outboxAppend(seed);
      }
    }

    return resolveCategoryCurrent(versions);
  },

  async append(v: CategoryVersion): Promise<void> {
    const versions = getJSON<CategoryVersion[]>(KEY_CATEGORY_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_CATEGORY_VERSIONS, versions);
    
    // @ts-expect-error - outbox accepts all versions but typed to TxVersion for now.
    outboxAppend(v);
  }
};
