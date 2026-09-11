import { RecurrenceFrequency } from '@/kernel';
import { Pressable, Text, View } from 'react-native';

export function RepeatOptions({
  localFrequency,
  setLocalFrequency,
}: {
  localFrequency: RecurrenceFrequency | 'none';
  setLocalFrequency: (freq: RecurrenceFrequency | 'none') => void;
}) {
  return (
    <View className="flex-row flex-wrap">
      {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => {
        const isSelected = localFrequency === freq;
        return (
          <View key={freq} className="w-1/3 pb-2 px-1">
            <Pressable
              className={`px-4 py-3 rounded-xl border ${isSelected ? 'bg-primary border-primary' : 'bg-surface-container border-surface-variant'}`}
              onPress={() => setLocalFrequency(freq)}
            >
              <Text
                className={`text-center font-medium ${isSelected ? 'text-surface' : 'text-on-surface'}`}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
