import React from 'react';
import { View, Text } from 'react-native';
import { Minor, formatMinor } from '@/kernel/money';

interface AmountDisplayProps {
  amount: Minor;
}

const config = { symbol: '$', decimals: 2 };

export function AmountDisplay({ amount }: AmountDisplayProps) {
  const formatted = formatMinor(amount, config);

  return (
    <View className="items-end justify-center py-8 px-6 min-h-[120px]">
      <Text className="text-zinc-100 text-6xl font-semibold tracking-tighter" testID="AmountDisplay">
        {formatted}
      </Text>
    </View>
  );
}
