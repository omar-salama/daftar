import { useCategories, useDeleteCategory, useReorderCategories } from '@/features/categories/hooks';
import { CategoryVersion } from '@/features/categories/model';
import { CategoryListItem } from '@/features/categories/ui';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/ui/AppHeader';

const CategoryRow = ({ item, type, isActive, drag, deleteCategory, allRelevant }: {
  item: CategoryVersion;
  type: string;
  isActive: boolean;
  drag: () => void;
  deleteCategory: any;
  allRelevant: CategoryVersion[];
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const subCategories = allRelevant
    .filter(c => c.parentId === item.categoryId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <ScaleDecorator>
      <View className="border-b border-surface-container">
        <CategoryListItem
          item={item}
          type={type}
          isActive={isActive}
          drag={drag}
          onDelete={(item) => deleteCategory.mutate(item)}
          hasSubCategories={subCategories.length > 0}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
          subCount={subCategories.length}
        />
        {subCategories.length > 0 && isExpanded && (
          <View>
            {subCategories.map((subItem) => (
              <View
                key={subItem.categoryId}
                className="border-t border-surface-variant pl-4"
              >
                <CategoryListItem
                  item={subItem}
                  type={type}
                  isActive={false}
                  drag={() => { }} // Disabled for subcategories
                  onDelete={(item) => deleteCategory.mutate(item)}
                  isSubCategory
                />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScaleDecorator>
  );
};
export default function CategoryManagementScreen() {
  const { type = 'expense' } = useLocalSearchParams<{ type?: string }>();
  const router = useRouter();

  const { data: categories = [] } = useCategories();
  const reorderCategories = useReorderCategories();
  const deleteCategory = useDeleteCategory();

  const [data, setData] = useState<CategoryVersion[]>([]);
  const [allRelevant, setAllRelevant] = useState<CategoryVersion[]>([]);

  useEffect(() => {
    const relevant = categories.filter(c => c.type === type);
    setAllRelevant(relevant);
    setData(
      relevant
        .filter(c => !c.parentId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    );
  }, [categories, type]);

  const handleDragEnd = ({ data: newData }: { data: CategoryVersion[] }) => {
    setData(newData);
    reorderCategories.mutate(newData);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<CategoryVersion>) => {
    return (
      <CategoryRow
        item={item}
        type={type}
        isActive={isActive}
        drag={drag}
        deleteCategory={deleteCategory}
        allRelevant={allRelevant}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

        <AppHeader
          title={type === 'expense' ? 'Expense Categories' : 'Income Categories'}
          rightAction={{ label: "+", onPress: () => router.push(`/category-form?type=${type}`) }}
        />
        <View className="flex-1">
          {data.length === 0 ? (
            <Text className="text-on-surface-variant text-center mt-8 mb-4">No categories found.</Text>
          ) : (
            <DraggableFlatList
              data={data}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.categoryId}
              renderItem={renderItem}
            />
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
