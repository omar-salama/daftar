import React from 'react';
import { View, Text } from 'react-native';
import { formatMinor, Minor } from '@/kernel/money';

interface AccountsSummaryHeaderProps {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export function AccountsSummaryHeader({ netWorth, totalAssets, totalLiabilities }: AccountsSummaryHeaderProps) {
  return (
    <View className="px-4 py-6 bg-surface-elevated border-b border-border mb-4">
      <Text className="text-sm text-foreground-muted font-medium">NET WORTH</Text>
      <Text className={`text-4xl font-bold ${netWorth < 0 ? 'text-danger' : 'text-foreground'}`}>
        {formatMinor(netWorth as Minor, { symbol: '$', decimals: 2 })}
      </Text>
      
      <View className="flex-row justify-between mt-4">
        <View>
          <Text className="text-xs text-foreground-muted font-medium">ASSETS</Text>
          <Text className="text-lg font-semibold text-success">
            {formatMinor(totalAssets as Minor, { symbol: '$', decimals: 2 })}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-foreground-muted font-medium">LIABILITIES</Text>
          <Text className="text-lg font-semibold text-danger">
            {formatMinor(totalLiabilities as Minor, { symbol: '$', decimals: 2 })}
          </Text>
        </View>
      </View>
    </View>
  );
}
