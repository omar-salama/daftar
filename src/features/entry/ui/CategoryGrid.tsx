import type { TxType } from '@/kernel';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useCategories } from '../../categories/hooks';

interface CategoryGridProps {
  txType: TxType;
  onSelectCategory: (id: string) => void;
  onSplit: () => void;
  selectedCategoryId?: string;
}

export function CategoryGrid({ txType, onSelectCategory, onSplit, selectedCategoryId }: CategoryGridProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading || !categories) {
    return (
      <View className="p-4 items-center justify-center border-t border-surface-variant bg-surface">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  const activeCategories = categories
    .filter(c => c.type === txType)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <View className="flex-row flex-wrap bg-surface">
      {activeCategories.map(c => {
        const isSelected = c.categoryId === selectedCategoryId;
        return (
          <View key={c.categoryId} className="w-1/4 px-1 pt-1">
            <Pressable
              onPress={() => onSelectCategory(c.categoryId)}
              testID={`category-${c.categoryId}`}
              className={`items-center justify-center rounded gap-1 p-2 min-h-[52px] flex-col bg-surface-container active:bg-surface-container-high border ${isSelected ? 'border-primary bg-primary-container' : 'border-transparent'
                }`}
            >
              <Text className="text-lg">{c.icon}</Text>
              <Text
                className={`text-[10px] ${isSelected ? 'text-on-surface-variant' : 'font-medium text-on-surface-variant'}`}
                numberOfLines={1}
              >
                {c.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
      {txType === 'expense' && (
        <View className="w-1/4 px-1 pt-1">
          <Pressable
            onPress={onSplit}
            className="items-center justify-center rounded gap-1 p-2 min-h-[52px] flex-col bg-surface-container border border-transparent active:opacity-70"
          >
            <Text className="text-lg">➗</Text>
            <Text className="text-[10px] font-medium text-on-surface-variant">
              Split
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
