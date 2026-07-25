import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import type { TxType } from '@/kernel';
import { useCategories } from '../../categories/hooks';

interface CategoryGridProps {
  txType: TxType;
  onSelectCategory: (id: string) => void;
  onSplit: () => void;
}

export function CategoryGrid({ txType, onSelectCategory, onSplit }: CategoryGridProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading || !categories) {
    return (
      <View className="p-4 items-center justify-center border-t border-border bg-surface">
        <ActivityIndicator size="small" />
      </View>
    );
  }

  const activeCategories = categories
    .filter(c => c.type === txType)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <View className="flex-row flex-wrap p-2 border-t border-border bg-surface">
      {activeCategories.map(c => (
        <View key={c.categoryId} className="w-1/4 p-1">
          <Pressable 
            onPress={() => onSelectCategory(c.categoryId)}
            testID={`category-${c.categoryId}`}
            className="bg-surface-elevated items-center justify-center rounded-xl p-3 min-h-[44px] active:bg-surface-hover"
          >
            <Text className="text-xl mb-0.5">{c.icon}</Text>
            <Text className="text-foreground-secondary text-[10px] font-medium" numberOfLines={1}>{c.name}</Text>
          </Pressable>
        </View>
      ))}
      {txType === 'expense' && (
        <View className="w-1/4 p-1">
          <Pressable 
            onPress={onSplit}
            className="bg-surface-elevated items-center justify-center rounded-xl p-3 min-h-[44px] border border-border-strong active:bg-surface-hover"
          >
            <Text className="text-lg mb-0.5">➗</Text>
            <Text className="text-foreground-secondary text-[10px] font-medium">Split</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
