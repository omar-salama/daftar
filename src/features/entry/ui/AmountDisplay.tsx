import { Minor, formatMinor } from '@/kernel/money';
import { Text, View } from 'react-native';

interface AmountDisplayProps {
  amount: Minor;
}

const config = { symbol: '$', decimals: 2 };

export function AmountDisplay({ amount }: AmountDisplayProps) {
  const formatted = formatMinor(amount, config);

  return (
    <View className="items-center justify-center min-h-[154px] px-6">
      <Text className="text-[#8e8e93] text-[11px] font-bold tracking-[1.1px] mb-2">AMOUNT</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} className="text-white text-[54px] font-bold tracking-[-2px]" testID="AmountDisplay">
        {formatted}
      </Text>
    </View>
  );
}