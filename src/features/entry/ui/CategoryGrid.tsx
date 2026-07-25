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
      {activeCategories.map(c => {
        const isSelected = c.categoryId === selectedCategoryId;
        return (
          <View key={c.categoryId} className="w-1/4 p-1">
            <Pressable 
              onPress={() => onSelectCategory(c.categoryId)}
              testID={`category-${c.categoryId}`}
              className={`items-center justify-center rounded-xl gap-1 p-2 min-h-[52px] flex-col bg-surface-elevated active:bg-surface-hover border ${
                isSelected ? 'border-[#52525b] bg-surface-hover' : 'border-transparent'
              }`}
            >
              <Text className="text-lg">{c.icon}</Text>
              <Text 
                className='text-[10px] font-medium text-foreground-secondary'
                numberOfLines={1}
              >
                {c.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
      {txType === 'expense' && (
        <View className="w-1/4 p-1">
          <Pressable 
            onPress={onSplit}
            className="items-center justify-center rounded-xl p-2 min-h-[52px] flex-col gap-1 bg-surface-elevated border border-border-strong active:opacity-70"
          >
            <Text className="text-lg">➗</Text>
            <Text className="text-[10px] font-medium text-foreground-secondary leading-none">
              Split
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
