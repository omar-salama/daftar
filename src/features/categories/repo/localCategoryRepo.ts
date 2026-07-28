import { RowId } from '@/kernel';
import { generateUuid, getJSON, nextVersion, outboxAppend, setJSON } from '@/lib/storage';
import { CategoryId, CategoryRepo, CategoryType, CategoryVersion, resolveCategoryCurrent } from '../model';

const KEY_CATEGORY_VERSIONS = 'categories.versions';

function createSeedCategory(id: string, name: string, icon: string, type: CategoryType, order: number): CategoryVersion {
  const { version, deviceId } = nextVersion();

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
      const seeds = [
        createSeedCategory('groceries', 'Groceries', '🛒', 'expense', 0),
        createSeedCategory('dining', 'Dining', '🍽', 'expense', 1),
        createSeedCategory('transport', 'Transport', '🚕', 'expense', 2),
        createSeedCategory('coffee', 'Coffee', '☕️', 'expense', 3),
        createSeedCategory('shopping', 'Shopping', '🛍', 'expense', 4),
        createSeedCategory('bills', 'Bills', '💡', 'expense', 5),
        createSeedCategory('entertainment', 'Entertainment', '🎬', 'expense', 6),
        createSeedCategory('salary', 'Salary', '💰', 'income', 0),
        createSeedCategory('other', 'Other', '💵', 'income', 1),
      ];
      
      versions = seeds;
      setJSON(KEY_CATEGORY_VERSIONS, versions);

      for (const seed of seeds) {
        outboxAppend(seed);
      }
    }

    return resolveCategoryCurrent(versions);
  },

  async append(v: CategoryVersion): Promise<void> {
    const versions = getJSON<CategoryVersion[]>(KEY_CATEGORY_VERSIONS) ?? [];
    versions.push(v);
    setJSON(KEY_CATEGORY_VERSIONS, versions);
    
    outboxAppend(v);
  }
};
