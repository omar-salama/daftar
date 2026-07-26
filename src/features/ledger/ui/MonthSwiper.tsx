import { Pressable, Text, View } from 'react-native';

interface MonthSwiperProps {
  monthName: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthSwiper({ monthName, onPrevMonth, onNextMonth }: MonthSwiperProps) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Pressable onPress={onPrevMonth} className="p-2 -ml-2" hitSlop={8}>
        <Text className="text-on-surface-variant text-3xl font-medium leading-6">‹</Text>
      </Pressable>
      <Text className="text-on-surface text-xl font-bold">{monthName}</Text>
      <Pressable onPress={onNextMonth} className="p-2 -mr-2" hitSlop={8}>
        <Text className="text-on-surface-variant text-3xl font-medium leading-6">›</Text>
      </Pressable>
    </View>
  );
}
