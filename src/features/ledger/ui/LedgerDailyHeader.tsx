import { Minor } from '@/kernel';
import { formatMinor, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/kernel/money';
import { useMainCurrency } from '@/features/settings/hooks/useSettings';
import { Text, View } from 'react-native';

interface LedgerDailyHeaderProps {
  date: string;
  incomeTotalMinor: Minor;
  expenseTotalMinor: Minor;
  accountCurrency?: string;
}

export function LedgerDailyHeader({ date, incomeTotalMinor, expenseTotalMinor, accountCurrency }: LedgerDailyHeaderProps) {
  const { data: mainCurrency = 'EGP' } = useMainCurrency();
  const currencyConfig = accountCurrency ? (SUPPORTED_CURRENCIES[accountCurrency] || DEFAULT_CURRENCY) : (SUPPORTED_CURRENCIES[mainCurrency] || DEFAULT_CURRENCY);
  
  const hasIncome = incomeTotalMinor > 0;
  const hasExpense = expenseTotalMinor > 0;

  const [year, month, day] = date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <View className="flex-row justify-between items-center px-4 py-1 bg-surface-container">
      <View className="flex-row items-center gap-2">
        <Text className="text-on-surface text-lg font-semibold">{day}</Text>
        <View className="bg-surface-container-high px-1.5 py-0.5 rounded">
          <Text className="text-on-surface-variant font-semibold text-xs tracking-smaller">{dayName}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <Text
          className={`w-24 text-right font-medium text-sm ${hasIncome ? 'text-secondary' : 'text-on-surface-variant'}`}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatMinor(incomeTotalMinor, currencyConfig)}
        </Text>
        <Text
          className={`w-24 text-right font-medium text-sm pl-2 ${hasExpense ? 'text-error' : 'text-on-surface-variant'}`} 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
          {formatMinor(expenseTotalMinor, currencyConfig)}
        </Text>
      </View>
    </View>
  );
}
