import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { CategoryVersion } from '../model';

interface SubcategoryListProps {
  categoryId: string;
  type: string;
  subCategories: CategoryVersion[];
}

export function SubcategoryList({ categoryId, type, subCategories }: SubcategoryListProps) {
  const router = useRouter();

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
      <View className="rounded-xl overflow-hidden border border-surface-variant bg-surface-container">
        {subCategories.length === 0 ? (
          <Text className="text-on-surface-variant text-sm py-3 px-4 text-center">No subcategories yet.</Text>
        ) : (
          subCategories.map((subItem, index) => (
            <View key={subItem.categoryId} className={index !== subCategories.length - 1 ? "border-b border-surface-variant" : ""}>
              <Pressable
                onPress={() => router.push(`/category-form?categoryId=${subItem.categoryId}&type=${type}`)}
                className="flex-row items-center justify-between py-3 px-4 bg-surface-container active:bg-surface-container-high"
              >
                <View className="flex-row items-center gap-3">
                  <Text>{subItem.icon}</Text>
                  <Text className="text-on-surface text-base">{subItem.name}</Text>
                </View>
                <Text className="text-on-surface-variant text-xl">›</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
