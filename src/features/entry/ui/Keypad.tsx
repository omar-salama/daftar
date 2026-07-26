import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
}

const keys = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '.', '0', 'backspace'
];

export function Keypad({ onDigit, onBackspace }: KeypadProps) {
  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'backspace') onBackspace();
    else onDigit(key);
  };

  return (
    <View className="flex-row flex-wrap w-full border-t border-surface-variant bg-container">
      {keys.map((k, index) => {
        const isRightEdge = index % 3 === 2;
        const isBottomEdge = Math.floor(index / 3) === 3;
        
        return (
          <View 
            key={k} 
            className={`w-1/3 ${!isRightEdge ? 'border-r border-surface-variant' : ''} ${!isBottomEdge ? 'border-b border-surface-variant' : ''}`}
          >
            <Pressable
              testID={`keypad-${k}`}
              onPress={() => handlePress(k)}
              className="h-16 items-center justify-center active:bg-surface-container-high min-h-[44px] min-w-[44px]"
            >
              {k === 'backspace' ? (
                <Text className="text-on-surface text-2xl font-mono">⌫</Text>
              ) : (
                <Text className="text-on-surface text-3xl font-mono">{k}</Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
