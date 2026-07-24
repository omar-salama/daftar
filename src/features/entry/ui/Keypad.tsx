import React from 'react';
import { View, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onDateNudge: () => void;
  dateStr: string;
}

const keys = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  'date', '0', 'backspace'
];

export function Keypad({ onDigit, onBackspace, onDateNudge, dateStr }: KeypadProps) {
  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'backspace') onBackspace();
    else if (key === 'date') onDateNudge();
    else onDigit(key);
  };

  return (
    <View className="flex-row flex-wrap w-full p-2 bg-zinc-950 pb-8">
      {keys.map((k) => (
        <View key={k} className="w-1/3 p-1">
          <Pressable
            testID={`keypad-${k}`}
            onPress={() => handlePress(k)}
            className="h-16 items-center justify-center bg-zinc-900 rounded-xl active:bg-zinc-800 min-h-[44px] min-w-[44px]"
          >
            {k === 'backspace' ? (
              <Text className="text-zinc-100 text-xl font-medium">⌫</Text>
            ) : k === 'date' ? (
              <Text className="text-zinc-400 text-sm font-medium">{dateStr}</Text>
            ) : (
              <Text className="text-zinc-100 text-2xl font-medium">{k}</Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
