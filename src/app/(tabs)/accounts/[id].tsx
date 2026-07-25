import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances';
import { LedgerList } from '@/features/ledger/ui/LedgerList';
import { formatMinor, Minor } from '@/kernel/money';

export default function AccountDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { data: accounts = [] } = useAccounts();
  const { balances } = useAccountBalances();
  
  const account = accounts.find(a => a.accountId === id);
  const balance = id ? (balances[id] || 0) : 0;

  if (!account) {
    return (
      <SafeAreaView className="flex-1 bg-surface justify-center items-center">
        <Text className="text-foreground-muted">Account not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2 bg-surface-hover rounded-lg border border-border">
          <Text className="text-foreground">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    router.push({ pathname: '/account-form', params: { accountId: account.accountId } });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-surface-elevated border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-xl text-foreground-secondary">‹ Back</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{account.name}</Text>
          <Text className="text-sm text-foreground-secondary capitalize">{account.type}</Text>
        </View>
        <Pressable onPress={handleEdit} className="bg-surface-hover px-3 py-1.5 rounded-lg border border-border">
          <Text className="text-foreground font-medium text-sm">Edit</Text>
        </Pressable>
      </View>

      {/* Balance Summary */}
      <View className="px-4 py-6 bg-surface-elevated border-b border-border">
        <Text className="text-sm text-foreground-muted font-medium">CURRENT BALANCE</Text>
        <Text className={`text-4xl font-bold ${account.type === 'credit' && balance < 0 ? 'text-danger' : 'text-foreground'}`}>
          {formatMinor(balance as Minor, { symbol: '$', decimals: 2 })}
        </Text>
      </View>

      {/* Ledger List */}
      <View className="flex-1">
        <LedgerList accountId={account.accountId} />
      </View>
    </SafeAreaView>
  );
}
