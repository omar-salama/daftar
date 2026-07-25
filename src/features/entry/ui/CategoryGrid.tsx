import { Pressable, Text, View } from 'react-native';
import type { TxType } from '@/kernel';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryGridProps {
  txType: TxType;
  onSelectCategory: (id: string) => void;
  onSplit: () => void;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Groceries', icon: '🛒' },
  { id: 'cat-2', name: 'Dining', icon: '🍽' },
  { id: 'cat-3', name: 'Transport', icon: '🚕' },
  { id: 'cat-4', name: 'Coffee', icon: '☕️' },
  { id: 'cat-5', name: 'Shopping', icon: '🛍' },
  { id: 'cat-6', name: 'Bills', icon: '💡' },
  { id: 'cat-7', name: 'Entertainment', icon: '🎬' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'inc-1', name: 'Salary', icon: '💰' },
  { id: 'inc-2', name: 'Other', icon: '💵' },
];

export function CategoryGrid({ txType, onSelectCategory, onSplit }: CategoryGridProps) {
  const categories = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <View className="flex-row flex-wrap p-2 border-t border-border bg-surface">
      {categories.map(c => (
        <View key={c.id} className="w-1/4 p-1">
          <Pressable 
            onPress={() => onSelectCategory(c.id)}
            testID={`category-${c.id}`}
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
