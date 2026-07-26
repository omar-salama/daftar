import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { LedgerList } from '@/features/ledger/ui/LedgerList';
import { formatMinor, Minor } from '@/kernel/money';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        <Text className="text-on-surface-variant">Account not found.</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2 bg-surface-container-high rounded-lg border border-surface-variant">
          <Text className="text-on-surface">Go Back</Text>
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
      <View className="flex-row items-center px-4 py-3 bg-surface-container border-b border-surface-variant">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Text className="text-xl text-on-surface-variant">‹ Back</Text>
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-bold text-on-surface">{account.name}</Text>
          <Text className="text-sm text-on-surface-variant capitalize">{account.type}</Text>
        </View>
        <Pressable onPress={handleEdit} className="bg-surface-container-high px-3 py-1.5 rounded-lg border border-surface-variant">
          <Text className="text-on-surface font-medium text-sm">Edit</Text>
        </Pressable>
      </View>

      {/* Balance Summary */}
      <View className="px-4 py-6 bg-surface-container border-b border-surface-variant">
        <Text className="text-sm text-on-surface-variant font-medium">CURRENT BALANCE</Text>
        <Text className={`text-4xl font-bold ${account.type === 'credit' && balance < 0 ? 'text-error' : 'text-on-surface'}`}>
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
