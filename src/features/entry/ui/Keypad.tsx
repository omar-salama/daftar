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
    <View className="flex-row flex-wrap w-full p-2 bg-zinc-950">
      {keys.map((k) => (
        <View key={k} className="w-1/3 p-1">
          <Pressable
            testID={`keypad-${k}`}
            onPress={() => handlePress(k)}
            className="h-16 items-center justify-center bg-zinc-900 rounded-xl active:bg-zinc-800 min-h-[44px] min-w-[44px]"
          >
            {k === 'backspace' ? (
              <Text className="text-zinc-100 text-xl font-medium">⌫</Text>
            ) : (
              <Text className="text-zinc-100 text-2xl font-medium">{k}</Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
