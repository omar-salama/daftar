import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NestableDraggableFlatList, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useDeleteCategory, useReorderCategories } from '../hooks';
import { CategoryVersion } from '../model';
import { CategoryListItem } from './CategoryListItem';

interface SubcategoryListProps {
  categoryId: string;
  type: string;
  subCategories: CategoryVersion[];
}

export function SubcategoryList({ categoryId, type, subCategories: initialSubCategories }: SubcategoryListProps) {
  const router = useRouter();
  const reorderCategories = useReorderCategories();
  const deleteCategory = useDeleteCategory();

  const [subCategories, setSubCategories] = useState(initialSubCategories);

  useEffect(() => {
    setSubCategories(initialSubCategories);
  }, [initialSubCategories]);

  const handleDragEnd = ({ data: newData }: { data: CategoryVersion[] }) => {
    setSubCategories(newData);
    reorderCategories.mutate(newData);
  };

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
        {subCategories.length === 0 ? (
          <Text className="text-on-surface-variant text-sm py-3 px-4 text-center">No subcategories yet.</Text>
        ) : (
          <NestableDraggableFlatList
            data={subCategories}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.categoryId}
            renderItem={({ item, drag, isActive, getIndex }) => {
              const index = getIndex() ?? 0;
              const showDivider = index < subCategories.length - 1;
              return (
                <ScaleDecorator>
                  <View className={showDivider ? 'border-b border-surface-variant' : ''}>
                    <CategoryListItem
                      item={item}
                      type={type}
                      isActive={isActive}
                      drag={drag}
                      onDelete={(itemToDelete) => deleteCategory.mutate(itemToDelete)}
                      containerClassName="bg-surface-container"
                    />
                  </View>
                </ScaleDecorator>
              )
            }}
          />
        )}
      </View>
    </View>
  );
}
