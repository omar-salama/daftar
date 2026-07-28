import { AppHeader } from '@/components/ui/AppHeader';
import { useCategories, useDeleteCategory, useReorderCategories } from '@/features/categories/hooks';
import { CategoryVersion } from '@/features/categories/model';
import { CategoryRow } from '@/features/categories/ui';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { NestableDraggableFlatList, NestableScrollContainer, RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';


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
        onDelete={(item) => deleteCategory.mutate(item)}
        allRelevant={allRelevant}
      />
    );
  };

  return (
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
          <NestableScrollContainer>
            <NestableDraggableFlatList
              data={data}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.categoryId}
              renderItem={renderItem}
            />
          </NestableScrollContainer>
        )}
      </View>
    </SafeAreaView>
  );
}
