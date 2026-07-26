import { TxLine } from '@/kernel';
import { Minor, formatMinor } from '@/kernel/money';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useCategories } from '../../categories/hooks';

interface SplitEditorProps {
  totalMinor: Minor;
  onSave: (lines: TxLine[]) => void;
  onCancel: () => void;
}

export function SplitEditor({ totalMinor, onSave, onCancel }: SplitEditorProps) {
  const { data: categories, isLoading } = useCategories();
  
  const half = Math.floor(totalMinor / 2) as Minor;
  const remainder = (totalMinor - half) as Minor;

  const expenseCategories = categories?.filter(c => c.type === 'expense') || [];

  const [lines] = useState<TxLine[]>([
    { categoryId: expenseCategories[0]?.categoryId || 'cat-1', amountMinor: half },
    { categoryId: expenseCategories[1]?.categoryId || 'cat-2', amountMinor: remainder },
  ]);

  const handleSave = () => {
    onSave(lines);
  };

  if (isLoading || !categories) {
    return (
      <View className="flex-1 p-4 bg-surface border-t border-surface-variant items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-surface border-t border-surface-variant">
      <Text className="text-on-surface text-lg font-medium mb-4">
        Split Transaction
      </Text>
      <ScrollView className="flex-1">
        {lines.map((l, i) => (
          <View 
            key={i} 
            className="flex-row justify-between py-2 border-b border-surface-variant"
          >
            <Text className="text-on-surface-variant">{categories.find(c => c.categoryId === l.categoryId)?.name || 'Unknown'}</Text>
            <Text className="text-on-surface">{formatMinor(l.amountMinor, { symbol: '$', decimals: 2 })}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="flex-row mt-4 gap-2">
        <Pressable 
          onPress={onCancel} 
          className="flex-1 p-4 bg-surface-container-high rounded-xl items-center min-h-[44px]"
        >
          <Text className="text-on-surface font-medium">Cancel</Text>
        </Pressable>
        <Pressable 
          onPress={handleSave} 
          className="flex-1 p-4 bg-primary rounded-xl items-center min-h-[44px] active:bg-primary-container"
        >
          <Text className="text-on-surface font-medium">Save Split</Text>
        </Pressable>
      </View>
    </View>
  );
}
