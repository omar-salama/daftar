import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useDeleteCategory } from '../hooks';
import { CategoryVersion } from '../model';
import { DraggableCategoryList } from './DraggableCategoryList';

interface SubcategoryListProps {
  categoryId: string;
  type: string;
  subCategories: CategoryVersion[];
}

export function SubcategoryList({ categoryId, type, subCategories: initialSubCategories }: SubcategoryListProps) {
  const router = useRouter();
  const deleteCategory = useDeleteCategory();

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-on-surface-variant">Subcategories</Text>
        <Pressable
          onPress={() => router.push(`/category-form?type=${type}&parentId=${categoryId}`)}
          hitSlop={8}
        >
          <Text className="text-primary text-sm font-semibold">+ Add New</Text>
        </Pressable>
      </View>
      <View className="rounded-xl overflow-hidden border border-surface-variant">
        {initialSubCategories.length === 0 ? (
          <Text className="text-on-surface-variant text-sm py-3 px-4 text-center">No subcategories yet.</Text>
        ) : (
          <DraggableCategoryList
            categories={initialSubCategories}
            type={type}
            onDelete={(itemToDelete) => deleteCategory.mutate(itemToDelete)}
            withDividers={true}
            containerClassName="bg-surface-container"
          />
        )}
      </View>
    </View>
  );
}
