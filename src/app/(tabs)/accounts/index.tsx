import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useAccounts, useAppendAccount } from '@/features/accounts/hooks/useAccounts';
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances';
import { AccountVersion } from '@/features/accounts/model';
import { formatMinor, Minor } from '@/kernel/money';
import { getHlcState, getDeviceId, setHlcState } from '@/lib/storage';
import { nextHLC } from '@/kernel';

export default function AccountsTab() {
  const { data: accounts = [] } = useAccounts();
  const { balances, totalAssets, totalLiabilities, netWorth } = useAccountBalances();
  const appendAccount = useAppendAccount();
  const router = useRouter();

  // Local state for dragging
  const [data, setData] = useState(accounts);
  
  // Sync local state when accounts change
  React.useEffect(() => {
    setData([...accounts].sort((a, b) => a.order - b.order));
  }, [accounts]);

  const handleDragEnd = ({ data: newData }: { data: AccountVersion[] }) => {
    setData(newData);
    // Update the order in the database for each item whose order changed
    const now = Date.now();
    const deviceId = getDeviceId();
    let hlcState = getHlcState();

    newData.forEach((account, index) => {
      if (account.order !== index) {
        const [version, nextState] = nextHLC(now, hlcState, deviceId);
        hlcState = nextState;
        
        appendAccount.mutate({
          ...account,
          version,
          order: index,
        });
      }
    });
    setHlcState(hlcState);
  };

  const handleAddAccount = () => {
    router.push('/account-form');
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<AccountVersion>) => {
    const bal = balances[item.accountId] || 0;
    
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
              {formatMinor(bal as Minor, { symbol: '$', decimals: 2 })}
            </Text>
            <Text className="text-xs text-foreground-muted">☰</Text>
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
        {/* Header Dashboard */}
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

        {/* Header Action */}
        <View className="flex-row justify-between items-center px-4 mb-2">
          <Text className="text-xl font-bold text-foreground">Accounts</Text>
          <Pressable onPress={handleAddAccount} className="bg-surface-hover px-3 py-1.5 rounded-lg border border-border">
            <Text className="text-foreground font-medium text-sm">+ Add</Text>
          </Pressable>
        </View>

        {/* Draggable List */}
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
