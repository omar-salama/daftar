import { Text, View } from 'react-native';
import { Minor } from '@/kernel';
import { formatMinor } from '@/kernel/money';

const CURRENCY_CONFIG = { symbol: '$', decimals: 2 };

interface LedgerDailyHeaderProps {
  date: string;
  incomeTotalMinor: Minor;
  expenseTotalMinor: Minor;
}

export function LedgerDailyHeader({ date, incomeTotalMinor, expenseTotalMinor }: LedgerDailyHeaderProps) {
  const hasIncome = incomeTotalMinor > 0;
  const hasExpense = expenseTotalMinor > 0;

  const [year, month, day] = date.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <View className="flex-row justify-between items-center px-4 py-1 bg-surface-elevated">
      <View className="flex-row items-center gap-2">
        <Text className="text-foreground text-lg font-semibold">{day}</Text>
        <View className="bg-surface-hover px-1.5 py-0.5 rounded">
          <Text className="text-foreground-secondary font-semibold text-xs tracking-smaller">{dayName}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        <Text
          className={`w-24 text-right font-medium text-sm ${hasIncome ? 'text-success' : 'text-foreground-muted'}`}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          +{formatMinor(incomeTotalMinor, CURRENCY_CONFIG)}
        </Text>
        <Text
          className={`w-24 text-right font-medium text-sm pl-2 ${hasExpense ? 'text-foreground-secondary' : 'text-foreground-muted'}`} 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
          {formatMinor(expenseTotalMinor, CURRENCY_CONFIG)}
        </Text>
      </View>
    </View>
  );
}
