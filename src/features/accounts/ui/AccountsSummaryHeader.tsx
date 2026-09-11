import { formatMinor, Minor, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '@/kernel/money';
import { Text, View } from 'react-native';

interface AccountsSummaryHeaderProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  mainCurrency?: string;
}

export function AccountsSummaryHeader({ netWorth, totalAssets, totalLiabilities, mainCurrency }: AccountsSummaryHeaderProps) {
  const currencyConfig = mainCurrency ? SUPPORTED_CURRENCIES[mainCurrency] : DEFAULT_CURRENCY;

  return (
    <View className="px-4 py-6 bg-surface-container border-b border-surface-variant mb-4">
      <Text className="text-sm text-on-surface-variant font-medium">NET WORTH ({mainCurrency || 'EGP'})</Text>
      <Text className={`text-4xl font-bold ${netWorth < 0 ? 'text-error' : 'text-on-surface'}`}>
        {formatMinor(netWorth as Minor, currencyConfig)}
      </Text>
      
      <View className="flex-row justify-between mt-4">
        <View>
          <Text className="text-xs text-on-surface-variant font-medium">ASSETS</Text>
          <Text className="text-lg font-semibold text-secondary">
            {formatMinor(totalAssets as Minor, currencyConfig)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-on-surface-variant font-medium">LIABILITIES</Text>
          <Text className="text-lg font-semibold text-error">
            {formatMinor(totalLiabilities as Minor, currencyConfig)}
          </Text>
        </View>
      </View>
    </View>
  );
}
