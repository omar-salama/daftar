import { Minor } from '@/kernel';
import { DEFAULT_CURRENCY, formatMinor, SUPPORTED_CURRENCIES } from '@/kernel/money';
import { useMainCurrency } from '@/features/settings/hooks/useSettings';
import { Text, View } from 'react-native';

interface MonthTotalsProps {
  monthIncome: Minor;
  monthExpense: Minor;
  monthTotal: Minor;
  accountCurrency?: string;
}

export function MonthTotals({ monthIncome, monthExpense, monthTotal, accountCurrency }: MonthTotalsProps) {
  const { data: mainCurrency = 'EGP' } = useMainCurrency();
  const currencyConfig = accountCurrency ? (SUPPORTED_CURRENCIES[accountCurrency] || DEFAULT_CURRENCY) : (SUPPORTED_CURRENCIES[mainCurrency] || DEFAULT_CURRENCY);

  return (
    <View className="flex-row justify-between items-center px-4 py-2 bg-surface">
      <View className="flex-row gap-4">
        <Text className="text-secondary font-semibold">{formatMinor(monthIncome, currencyConfig)}</Text>
        <Text className="text-on-surface-variant opacity-30">|</Text>
        <Text className="text-error font-semibold">{formatMinor(monthExpense, currencyConfig)}</Text>
      </View>
      <View className="bg-surface-container px-3 py-1 rounded-full border border-surface-variant">
        <Text className={`font-bold ${monthTotal > 0 ? 'text-secondary' : monthTotal < 0 ? 'text-error' : 'text-on-surface'}`}>
          {monthTotal > 0 ? '+' : ''}{formatMinor(monthTotal as Minor, currencyConfig)}
        </Text>
      </View>
    </View>
  );
}
