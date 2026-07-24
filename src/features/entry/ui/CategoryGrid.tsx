import { Pressable, Text, View } from 'react-native';

interface CategoryGridProps {
  onSelectCategory: (id: string) => void;
  onSplit: () => void;
}

export const DUMMY_CATEGORIES = [
  { id: 'cat-1', name: 'Groceries', icon: '🛒' },
  { id: 'cat-2', name: 'Dining', icon: '🍽' },
  { id: 'cat-3', name: 'Transport', icon: '🚕' },
  { id: 'cat-4', name: 'Coffee', icon: '☕️' },
  { id: 'cat-5', name: 'Shopping', icon: '🛍' },
  { id: 'cat-6', name: 'Bills', icon: '💡' },
  { id: 'cat-7', name: 'Entertainment', icon: '🎬' },
];

export function CategoryGrid({ onSelectCategory, onSplit }: CategoryGridProps) {
  return (
    <View 
      className="flex-row flex-wrap p-2 border-t border-zinc-900 bg-zinc-950"
      style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8, borderTopWidth: 1, borderTopColor: '#18181b', backgroundColor: '#09090b' }}
    >
      {DUMMY_CATEGORIES.map(c => (
        <View key={c.id} className="w-1/4 p-1" style={{ width: '25%', padding: 4 }}>
          <Pressable 
            onPress={() => onSelectCategory(c.id)}
            testID={`category-${c.id}`}
            className="bg-zinc-900 items-center justify-center rounded-xl p-3 min-h-[44px] active:bg-zinc-800"
            style={{ backgroundColor: '#18181b', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 12, minHeight: 44 }}
          >
            <Text className="text-xl mb-1" style={{ fontSize: 20, marginBottom: 2 }}>{c.icon}</Text>
            <Text className="text-zinc-300 text-[10px] font-medium" numberOfLines={1} style={{ color: '#d4d4d8', fontSize: 10, fontWeight: '500' }}>{c.name}</Text>
          </Pressable>
        </View>
      ))}
      <View className="w-1/4 p-1" style={{ width: '25%', padding: 4 }}>
        <Pressable 
          onPress={onSplit}
          className="bg-zinc-900 items-center justify-center rounded-xl p-3 min-h-[44px] border border-zinc-800 active:bg-zinc-800"
          style={{ backgroundColor: '#18181b', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 12, minHeight: 44, borderWidth: 1, borderColor: '#27272a' }}
        >
          <Text className="text-lg mb-1" style={{ fontSize: 18, marginBottom: 2 }}>➗</Text>
          <Text className="text-zinc-300 text-[10px] font-medium" style={{ color: '#d4d4d8', fontSize: 10, fontWeight: '500' }}>Split</Text>
        </Pressable>
      </View>
    </View>
  );
}
