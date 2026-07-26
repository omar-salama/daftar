import { Minor } from '@/kernel';
import { formatMinor } from '@/kernel/money';
import { Text, View } from 'react-native';

const CURRENCY_CONFIG = { symbol: '$', decimals: 2 };

interface MonthTotalsProps {
  monthIncome: Minor;
  monthExpense: Minor;
  monthTotal: Minor;
}

export function MonthTotals({ monthIncome, monthExpense, monthTotal }: MonthTotalsProps) {
  return (
    <View className="flex-row justify-between">
      <View className="items-center min-w-[77px]">
        <Text className="text-on-surface-variant text-xs mb-1 font-medium tracking-wide uppercase">Income</Text>
        <Text className="text-secondary font-semibold">{formatMinor(monthIncome, CURRENCY_CONFIG)}</Text>
      </View>
      <View className="items-center min-w-[77px]">
        <Text className="text-on-surface-variant text-xs mb-1 font-medium tracking-wide uppercase">Expense</Text>
        <Text className="text-error font-semibold">{formatMinor(monthExpense, CURRENCY_CONFIG)}</Text>
      </View>
      <View className="items-center min-w-[83px]">
        <Text className="text-on-surface-variant text-xs mb-1 font-medium tracking-wide uppercase">Total</Text>
        <Text className={`font-semibold ${monthTotal >= 0 ? 'text-secondary' : 'text-on-surface'}`}>
          {monthTotal > 0 ? '+' : ''}{formatMinor(monthTotal as Minor, CURRENCY_CONFIG)}
        </Text>
      </View>
    </View>
  );
}
