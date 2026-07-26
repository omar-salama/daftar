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
    <View className="flex-row flex-wrap w-full bg-surface">
      {keys.map((k) => (
        <View key={k} className="w-1/3 p-1">
          <Pressable
            testID={`keypad-${k}`}
            onPress={() => handlePress(k)}
            className="h-16 items-center justify-center bg-surface-elevated rounded-xl active:bg-surface-hover min-h-[44px] min-w-[44px]"
          >
            {k === 'backspace' ? (
              <Text className="text-foreground text-xl font-medium">⌫</Text>
            ) : (
              <Text className="text-foreground text-2xl font-medium">{k}</Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
