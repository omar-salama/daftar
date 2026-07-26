import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useRouter } from 'expo-router';
import { AccountVersion } from '../model';
import { formatMinor, Minor } from '@/kernel/money';

interface AccountListItemProps {
  item: AccountVersion;
  balance: number;
  drag: () => void;
  isActive: boolean;
}

export function AccountListItem({ item, balance, drag, isActive }: AccountListItemProps) {
  const router = useRouter();

  return (
    <ScaleDecorator>
      <Pressable
        onLongPress={drag}
        disabled={isActive}
        onPress={() => router.push(`/accounts/${item.accountId}`)}
        className={`flex-row justify-between items-center px-4 py-4 mb-2 mx-4 rounded-xl border border-border ${
          isActive ? 'bg-surface-hover' : 'bg-surface-elevated'
        }`}
      >
        <View>
          <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
          <Text className="text-sm text-foreground-secondary capitalize">{item.type}</Text>
        </View>
        <View className="items-end">
          <Text className="text-lg font-semibold text-foreground">
            {formatMinor(balance as Minor, { symbol: '$', decimals: 2 })}
          </Text>
          <Text className="text-xs text-foreground-muted">☰</Text>
        </View>
      </Pressable>
    </ScaleDecorator>
  );
}
