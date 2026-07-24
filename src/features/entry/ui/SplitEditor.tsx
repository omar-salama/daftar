import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Minor, formatMinor } from '@/kernel/money';
import { DUMMY_CATEGORIES } from './CategoryGrid';
import { TxLine } from '@/kernel';

interface SplitEditorProps {
  totalMinor: Minor;
  onSave: (lines: TxLine[]) => void;
  onCancel: () => void;
}

export function SplitEditor({ totalMinor, onSave, onCancel }: SplitEditorProps) {
  // Very simplistic: just 2 halves for now. Real implementation would be more complex.
  const half = Math.floor(totalMinor / 2) as Minor;
  const remainder = (totalMinor - half) as Minor;

  const [lines] = useState<TxLine[]>([
    { categoryId: DUMMY_CATEGORIES[0].id, amountMinor: half },
    { categoryId: DUMMY_CATEGORIES[1].id, amountMinor: remainder }
  ]);

  const handleSave = () => {
    // In a real one we'd let user pick. For now we just return the lines
    onSave(lines);
  };

  return (
    <View className="flex-1 p-4 bg-zinc-950 border-t border-zinc-900">
      <Text className="text-zinc-100 text-lg font-medium mb-4">Split Transaction</Text>
      <ScrollView>
        {lines.map((l, i) => (
          <View key={i} className="flex-row justify-between py-2 border-b border-zinc-900">
            <Text className="text-zinc-300">{DUMMY_CATEGORIES.find(c => c.id === l.categoryId)?.name}</Text>
            <Text className="text-zinc-100">{formatMinor(l.amountMinor, { symbol: '$', decimals: 2 })}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="flex-row mt-4 space-x-2">
        <Pressable onPress={onCancel} className="flex-1 p-4 bg-zinc-800 rounded-xl items-center min-h-[44px]">
          <Text className="text-zinc-100 font-medium">Cancel</Text>
        </Pressable>
        <Pressable onPress={handleSave} className="flex-1 p-4 bg-blue-600 rounded-xl items-center min-h-[44px]">
          <Text className="text-white font-medium">Save Split</Text>
        </Pressable>
      </View>
    </View>
  );
}
