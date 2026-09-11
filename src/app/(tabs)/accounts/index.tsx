import { useAccountTypes } from '@/features/account-types/hooks';
import { useAccountBalances } from '@/features/accounts/hooks/useAccountBalances';
import { useAccounts, useReorderAccounts } from '@/features/accounts/hooks/useAccounts';
import { AccountVersion } from '@/features/accounts/model';
import { AccountListItem, AccountsSummaryHeader } from '@/features/accounts/ui';
import { exchangeRateService } from '@/features/exchange-rates/ExchangeRateService';
import { useMainCurrency } from '@/features/settings/hooks/useSettings';
import { getTodayString } from '@/kernel/date';
import { DEFAULT_CURRENCY_CODE } from '@/kernel/money';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountsTab() {
  const { data: accounts = [] } = useAccounts();
  const { data: accountTypes = [] } = useAccountTypes();
  const { balances, dueAmounts, assetsByCurrency, liabilitiesByCurrency } = useAccountBalances();
  const reorderAccounts = useReorderAccounts();
  const router = useRouter();
  const { data: mainCurrency = DEFAULT_CURRENCY_CODE } = useMainCurrency();

  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [netWorth, setNetWorth] = useState(0);

  // Local state for dragging
  const [data, setData] = useState(accounts);
  
  // Sync local state when accounts change
  useEffect(() => {
    setData([...accounts].sort((a, b) => a.order - b.order));
  }, [accounts]);

  // Compute converted totals
  useEffect(() => {
    async function computeConvertedTotals() {
      let assets = 0;
      let liabilities = 0;
      const today = getTodayString();

      for (const [currency, amount] of Object.entries(assetsByCurrency)) {
        if (currency === mainCurrency) {
          assets += amount;
        } else {
          try {
            const rate = await exchangeRateService.getRate(currency, mainCurrency, today);
            assets += amount * rate;
          } catch (e) {
            assets += amount; // Fallback to 1:1 if network fails and no cache
          }
        }
      }

      for (const [currency, amount] of Object.entries(liabilitiesByCurrency)) {
        if (currency === mainCurrency) {
          liabilities += amount;
        } else {
          try {
            const rate = await exchangeRateService.getRate(currency, mainCurrency, today);
            liabilities += amount * rate;
          } catch (e) {
            liabilities += amount; // Fallback to 1:1 if network fails and no cache
          }
        }
      }

      setTotalAssets(assets);
      setTotalLiabilities(liabilities);
      setNetWorth(assets - liabilities);
    }
    computeConvertedTotals();
  }, [assetsByCurrency, liabilitiesByCurrency, mainCurrency]);

  const handleDragEnd = ({ data: newData }: { data: AccountVersion[] }) => {
    setData(newData);
    reorderAccounts.mutate(newData);
  };

  const handleAddAccount = () => {
    router.push('/account-form');
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<AccountVersion>) => {
    const balance = balances[item.accountId] || 0;
    const dueAmount = dueAmounts[item.accountId] || 0;
    const accountTypeInfo = accountTypes.find(t => t.accountTypeId === item.type);
    
    return (
      <AccountListItem
        item={item}
        balance={balance}
        dueAmount={dueAmount}
        drag={drag}
        isActive={isActive}
        accountTypeName={accountTypeInfo?.name}
        isLiability={accountTypeInfo?.isLiability}
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
          mainCurrency={mainCurrency}
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
