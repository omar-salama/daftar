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
  const half = Math.floor(totalMinor / 2) as Minor;
  const remainder = (totalMinor - half) as Minor;

  const [lines] = useState<TxLine[]>([
    { categoryId: DUMMY_CATEGORIES[0]?.id || 'cat-1', amountMinor: half },
    { categoryId: DUMMY_CATEGORIES[1]?.id || 'cat-2', amountMinor: remainder },
  ]);

  const handleSave = () => {
    onSave(lines);
  };

  return (
    <View 
      className="flex-1 p-4 bg-zinc-950 border-t border-zinc-900"
      style={{ flex: 1, padding: 16, backgroundColor: '#09090b', borderTopWidth: 1, borderTopColor: '#18181b' }}
    >
      <Text 
        className="text-zinc-100 text-lg font-medium mb-4"
        style={{ color: '#f4f4f5', fontSize: 18, fontWeight: '500', marginBottom: 16 }}
      >
        Split Transaction
      </Text>
      <ScrollView style={{ flex: 1 }}>
        {lines.map((l, i) => (
          <View 
            key={i} 
            className="flex-row justify-between py-2 border-b border-zinc-900"
            style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#18181b' }}
          >
            <Text className="text-zinc-300" style={{ color: '#d4d4d8' }}>{DUMMY_CATEGORIES.find(c => c.id === l.categoryId)?.name}</Text>
            <Text className="text-zinc-100" style={{ color: '#f4f4f5' }}>{formatMinor(l.amountMinor, { symbol: '$', decimals: 2 })}</Text>
          </View>
        ))}
      </ScrollView>
      <View className="flex-row mt-4 space-x-2" style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
        <Pressable 
          onPress={onCancel} 
          className="flex-1 p-4 bg-zinc-800 rounded-xl items-center min-h-[44px]"
          style={{ flex: 1, padding: 16, backgroundColor: '#27272a', borderRadius: 12, alignItems: 'center', minHeight: 44 }}
        >
          <Text className="text-zinc-100 font-medium" style={{ color: '#f4f4f5', fontWeight: '500' }}>Cancel</Text>
        </Pressable>
        <Pressable 
          onPress={handleSave} 
          className="flex-1 p-4 bg-blue-600 rounded-xl items-center min-h-[44px]"
          style={{ flex: 1, padding: 16, backgroundColor: '#2563eb', borderRadius: 12, alignItems: 'center', minHeight: 44 }}
        >
          <Text className="text-white font-medium" style={{ color: '#ffffff', fontWeight: '500' }}>Save Split</Text>
        </Pressable>
      </View>
    </View>
  );
}
