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
    <View 
      className="flex-row flex-wrap w-full p-2 bg-zinc-950"
      style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', padding: 8, backgroundColor: '#09090b' }}
    >
      {keys.map((k) => (
        <View key={k} className="w-1/3 p-1" style={{ width: '33.3333%', padding: 4 }}>
          <Pressable
            testID={`keypad-${k}`}
            onPress={() => handlePress(k)}
            className="h-16 items-center justify-center bg-zinc-900 rounded-xl active:bg-zinc-800 min-h-[44px] min-w-[44px]"
            style={{ height: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18181b', borderRadius: 12, minHeight: 44, minWidth: 44 }}
          >
            {k === 'backspace' ? (
              <Text className="text-zinc-100 text-xl font-medium" style={{ color: '#f4f4f5', fontSize: 20, fontWeight: '500' }}>⌫</Text>
            ) : (
              <Text className="text-zinc-100 text-2xl font-medium" style={{ color: '#f4f4f5', fontSize: 24, fontWeight: '500' }}>{k}</Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
