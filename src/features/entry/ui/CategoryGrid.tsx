import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface CategoryGridProps {
  onSelectCategory: (id: string) => void;
  onSplit: () => void;
}

export const DUMMY_CATEGORIES = [
  { id: 'cat-1', name: 'Groceries', icon: '🛒' },
  { id: 'cat-2', name: 'Dining', icon: '🍽' },
  { id: 'cat-3', name: 'Transport', icon: '🚕' },
  { id: 'cat-4', name: 'Coffee', icon: '☕️' },
  { id: 'cat-5', name: 'Entertainment', icon: '🎬' },
];

export function CategoryGrid({ onSelectCategory, onSplit }: CategoryGridProps) {
  return (
    <View className="flex-row flex-wrap p-2 border-t border-zinc-900 bg-zinc-950">
      {DUMMY_CATEGORIES.map(c => (
        <View key={c.id} className="w-1/3 p-1">
          <Pressable 
            onPress={() => onSelectCategory(c.id)}
            testID={`category-${c.id}`}
            className="bg-zinc-900 items-center justify-center rounded-xl p-4 min-h-[44px] active:bg-zinc-800"
          >
            <Text className="text-2xl mb-1">{c.icon}</Text>
            <Text className="text-zinc-300 text-xs font-medium">{c.name}</Text>
          </Pressable>
        </View>
      ))}
      <View className="w-1/3 p-1">
        <Pressable 
          onPress={onSplit}
          className="bg-zinc-900 items-center justify-center rounded-xl p-4 min-h-[44px] border border-zinc-800 active:bg-zinc-800"
        >
          <Text className="text-xl mb-1">➗</Text>
          <Text className="text-zinc-300 text-xs font-medium">Split</Text>
        </Pressable>
      </View>
    </View>
  );
}
