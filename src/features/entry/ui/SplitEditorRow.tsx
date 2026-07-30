import { Pressable, Text, View } from 'react-native';

interface SplitEditorRowProps {
  id: string;
  digits: string;
  isActive: boolean;
  category?: { icon?: string; name: string };
  onFocus: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SplitEditorRow({ id, digits, isActive, category, onFocus, onRemove }: SplitEditorRowProps) {
  return (
    <Pressable 
      onPress={() => onFocus(id)}
      className={`flex-row items-center justify-between py-3 border-b border-surface-variant ${isActive ? 'bg-surface-container-high rounded-lg px-2 -mx-2' : ''}`}
    >
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => onRemove(id)} className="p-1">
          <Text className="text-error text-lg">❌</Text>
        </Pressable>
        <Text className="text-on-surface font-medium">
          {category?.icon} {category?.name || 'Unknown'}
        </Text>
      </View>
      <Text className={`text-xl font-mono ${isActive ? 'text-primary font-bold' : 'text-on-surface'}`}>
        {digits || '0'}
      </Text>
    </Pressable>
  );
}
