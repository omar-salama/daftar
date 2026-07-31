import { Minor } from '@/kernel';
import { formatMinor, DEFAULT_CURRENCY } from '@/kernel/money';
import { Text, View } from 'react-native';

interface MonthTotalsProps {
  monthIncome: Minor;
  monthExpense: Minor;
  monthTotal: Minor;
  isSpecificAccount?: boolean;
}

export function MonthTotals({ monthIncome, monthExpense, monthTotal, isSpecificAccount }: MonthTotalsProps) {
  return (
    <View className="flex-row justify-between">
      <View className="items-center min-w-[77px]">
        <Text className="text-on-surface-variant text-xs mb-1 font-medium tracking-wide uppercase">{isSpecificAccount ? 'Money In' : 'Income'}</Text>
        <Text className="text-secondary font-semibold">{formatMinor(monthIncome, DEFAULT_CURRENCY)}</Text>
      </View>
      <View className="items-center min-w-[77px]">
        <Text className="text-on-surface-variant text-xs mb-1 font-medium tracking-wide uppercase">{isSpecificAccount ? 'Money Out' : 'Expense'}</Text>
        <Text className="text-error font-semibold">{formatMinor(monthExpense, DEFAULT_CURRENCY)}</Text>
      </View>
      <View className="items-center min-w-[83px]">
        <Text className="text-on-surface-variant text-xs mb-1 font-medium tracking-wide uppercase">Total</Text>
        <Text className={`font-semibold ${monthTotal >= 0 ? 'text-secondary' : 'text-on-surface'}`}>
          {monthTotal > 0 ? '+' : ''}{formatMinor(monthTotal as Minor, DEFAULT_CURRENCY)}
        </Text>
      </View>
    </View>
  );
}
