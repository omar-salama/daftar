import { formatMinor, Minor } from '@/kernel/money';
import { Text, View } from 'react-native';

interface AccountsSummaryHeaderProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export function AccountsSummaryHeader({ netWorth, totalAssets, totalLiabilities }: AccountsSummaryHeaderProps) {
  return (
    <View className="px-4 py-6 bg-surface-container border-b border-surface-variant mb-4">
      <Text className="text-sm text-on-surface-variant font-medium">NET WORTH</Text>
      <Text className={`text-4xl font-bold ${netWorth < 0 ? 'text-error' : 'text-on-surface'}`}>
        {formatMinor(netWorth as Minor, { symbol: '$', decimals: 2 })}
      </Text>
      
      <View className="flex-row justify-between mt-4">
        <View>
          <Text className="text-xs text-on-surface-variant font-medium">ASSETS</Text>
          <Text className="text-lg font-semibold text-secondary">
            {formatMinor(totalAssets as Minor, { symbol: '$', decimals: 2 })}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-on-surface-variant font-medium">LIABILITIES</Text>
          <Text className="text-lg font-semibold text-error">
            {formatMinor(totalLiabilities as Minor, { symbol: '$', decimals: 2 })}
          </Text>
        </View>
      </View>
    </View>
  );
}
