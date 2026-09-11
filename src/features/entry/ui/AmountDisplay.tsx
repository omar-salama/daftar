import type { TxType } from '@/kernel';
import { Minor, formatMinor, DEFAULT_CURRENCY } from '@/kernel/money';
import { Text, View } from 'react-native';

interface AmountDisplayProps {
  amount: Minor;
  txType?: TxType;
  currencyConfig?: typeof DEFAULT_CURRENCY;
}

export function AmountDisplay({ amount, txType = 'expense', currencyConfig = DEFAULT_CURRENCY }: AmountDisplayProps) {
  const formatted = formatMinor(amount, currencyConfig);
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