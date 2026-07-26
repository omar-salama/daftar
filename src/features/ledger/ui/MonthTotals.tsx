import { Text, View } from 'react-native';
import { Minor } from '@/kernel';
import { formatMinor } from '@/kernel/money';

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
        <Text className="text-foreground-muted text-xs mb-1 font-medium tracking-wide uppercase">Income</Text>
        <Text className="text-success font-semibold">{formatMinor(monthIncome, CURRENCY_CONFIG)}</Text>
      </View>
      <View className="items-center min-w-[77px]">
        <Text className="text-foreground-muted text-xs mb-1 font-medium tracking-wide uppercase">Expense</Text>
        <Text className="text-foreground-secondary font-semibold">{formatMinor(monthExpense, CURRENCY_CONFIG)}</Text>
      </View>
      <View className="items-center min-w-[83px]">
        <Text className="text-foreground-muted text-xs mb-1 font-medium tracking-wide uppercase">Total</Text>
        <Text className={`font-semibold ${monthTotal >= 0 ? 'text-success' : 'text-foreground'}`}>
          {monthTotal > 0 ? '+' : ''}{formatMinor(monthTotal as Minor, CURRENCY_CONFIG)}
        </Text>
      </View>
    </View>
  );
}
