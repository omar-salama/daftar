import type { TxType } from '@/kernel';
import { Minor, formatMinor } from '@/kernel/money';
import { Text, View } from 'react-native';

interface AmountDisplayProps {
  amount: Minor;
  txType?: TxType;
}

const config = { symbol: '$', decimals: 2 };

export function AmountDisplay({ amount, txType = 'expense' }: AmountDisplayProps) {
  const formatted = formatMinor(amount, config);
  const isZero = amount === 0;

  const colorClass = isZero
    ? 'text-foreground-muted'
    : txType === 'income'
      ? 'text-success'
      : 'text-foreground'

  return (
    <View className="items-center justify-center">
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        className={`${colorClass} text-[54px] font-bold tracking-[-2px]`}
        testID="AmountDisplay"
      >
        {txType === 'income' && !isZero ? '+' : ''}{formatted}
      </Text>
    </View>
  );
}