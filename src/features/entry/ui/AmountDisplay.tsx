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
    ? 'text-on-surface-variant'
    : txType === 'income'
      ? 'text-secondary'
      : 'text-on-surface'

  return (
    <View className="items-center justify-center">
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        className={`${colorClass} text-[40px] leading-[48px] font-mono font-bold tracking-[-0.02em]`}
        testID="AmountDisplay"
      >
        {txType === 'income' && !isZero ? '+' : ''}{formatted}

      </Text>
    </View>
  );
}