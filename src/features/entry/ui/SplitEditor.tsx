import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Minor, formatMinor } from '@/kernel/money';
import { EXPENSE_CATEGORIES } from './CategoryGrid';
import { TxLine } from '@/kernel';

interface SplitEditorProps {
  totalMinor: Minor;
  onSave: (lines: TxLine[]) => void;
  onCancel: () => void;
}

export function SplitEditor({ totalMinor, onSave, onCancel }: SplitEditorProps) {
  const half = Math.floor(totalMinor / 2) as Minor;
  const remainder = (totalMinor - half) as Minor;

  const [lines] = useState<TxLine[]>([
    { categoryId: EXPENSE_CATEGORIES[0]?.id || 'cat-1', amountMinor: half },
    { categoryId: EXPENSE_CATEGORIES[1]?.id || 'cat-2', amountMinor: remainder },
  ]);

  const handleSave = () => {
    onSave(lines);
  };

  return (
    <View className="flex-1 p-4 bg-surface border-t border-border">
      <Text className="text-foreground text-lg font-medium mb-4">
        Split Transaction
      </Text>
      <ScrollView className="flex-1">
        {lines.map((l, i) => (
          <View 
            key={i} 
            className="flex-row justify-between py-2 border-b border-border"
          >
            <Text className="text-foreground-secondary">{EXPENSE_CATEGORIES.find(c => c.id === l.categoryId)?.name}</Text>
            <Text className="text-foreground">{formatMinor(l.amountMinor, { symbol: '$', decimals: 2 })}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="flex-row mt-4 gap-2">
        <Pressable 
          onPress={onCancel} 
          className="flex-1 p-4 bg-surface-hover rounded-xl items-center min-h-[44px]"
        >
          <Text className="text-foreground font-medium">Cancel</Text>
        </Pressable>
        <Pressable 
          onPress={handleSave} 
          className="flex-1 p-4 bg-brand rounded-xl items-center min-h-[44px] active:bg-brand-active"
        >
          <Text className="text-foreground font-medium">Save Split</Text>
        </Pressable>
      </View>
    </View>
  );
}
