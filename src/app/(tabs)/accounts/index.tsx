import { useAccountTypes } from '@/features/account-types/hooks';
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances';
import { useAccounts, useReorderAccounts } from '@/features/accounts/hooks/useAccounts';
import { AccountVersion } from '@/features/accounts/model';
import { AccountListItem, AccountsSummaryHeader } from '@/features/accounts/ui';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountsTab() {
  const { data: accounts = [] } = useAccounts();
  const { data: accountTypes = [] } = useAccountTypes();
  const { balances, totalAssets, totalLiabilities, netWorth } = useAccountBalances();
  const reorderAccounts = useReorderAccounts();
  const router = useRouter();

  // Local state for dragging
  const [data, setData] = useState(accounts);
  
  // Sync local state when accounts change
  useEffect(() => {
    setData([...accounts].sort((a, b) => a.order - b.order));
  }, [accounts]);

  const handleDragEnd = ({ data: newData }: { data: AccountVersion[] }) => {
    setData(newData);
    reorderAccounts.mutate(newData);
  };

  const handleAddAccount = () => {
    router.push('/account-form');
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<AccountVersion>) => {
    const balance = balances[item.accountId] || 0;
    const accountTypeName = accountTypes.find(t => t.accountTypeId === item.type)?.name;
    
    return (
      <AccountListItem
        item={item}
        balance={balance}
        drag={drag}
        isActive={isActive}
        accountTypeName={accountTypeName}
      />
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        <AccountsSummaryHeader 
          netWorth={netWorth}
          totalAssets={totalAssets}
          totalLiabilities={totalLiabilities}
        />

        <View className="flex-row justify-between items-center px-4 mb-2">
          <Text className="text-xl font-bold text-on-surface">Accounts</Text>
          <Pressable onPress={handleAddAccount} className="bg-surface-container-high px-3 py-1.5 rounded-lg border border-surface-variant">
            <Text className="text-on-surface font-medium text-sm">+ Add</Text>
          </Pressable>
        </View>

        <DraggableFlatList
          data={data}
          onDragEnd={handleDragEnd}
          keyExtractor={(item) => item.rowId}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
