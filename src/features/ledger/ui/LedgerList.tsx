import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks';
import { Minor, TxVersion } from '@/kernel';
import { formatMinor } from '@/kernel/money';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useAppendTx, useCreateTx, useLedger, useLedgerAllVersions } from '../hooks/useLedger';
import { useMonthlyLedger } from '../hooks/useMonthlyLedger';
import { LedgerDailyHeader } from './LedgerDailyHeader';
import { LedgerRow } from './LedgerRow';
import { MonthSwiper } from './MonthSwiper';
import { MonthTotals } from './MonthTotals';

const CURRENCY_CONFIG = { symbol: '$', decimals: 2 };

type ListItem = 
  | { type: 'header'; date: string; expenseTotalMinor: Minor; incomeTotalMinor: Minor }
  | { type: 'row'; tx: TxVersion; versionCount: number };

export function LedgerList({ accountId }: { accountId?: string } = {}) {
  const { data: currentTxs = [] } = useLedger();
  const { data: allVersions = [] } = useLedgerAllVersions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const appendTx = useAppendTx();
  const createTx = useCreateTx();
  const router = useRouter();

  const [selectedTx, setSelectedTx] = useState<TxVersion | null>(null);

  const {
    handlePrevMonth,
    handleNextMonth,
    filteredTxs,
    monthIncome,
    monthExpense,
    monthTotal,
    monthName,
  } = useMonthlyLedger(currentTxs, accountId);

  const versionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of allVersions) {
      counts.set(v.txId, (counts.get(v.txId) || 0) + 1);
    }
    return counts;
  }, [allVersions]);

  const listData = useMemo(() => {
    // Sort transactions descending by date, then by HLC version
    const sorted = [...filteredTxs].sort((a, b) => {
      if (a.occurredAt !== b.occurredAt) {
        return b.occurredAt.localeCompare(a.occurredAt);
      }
      return b.version.localeCompare(a.version);
    });

    const items: ListItem[] = [];
    let currentDate = '';
    let currentExpenseTotal = 0 as Minor;
    let currentIncomeTotal = 0 as Minor;
    let currentDayStartIndex = -1;

    for (const tx of sorted) {
      const isIncome = tx.type === 'income';
      if (tx.occurredAt !== currentDate) {
        if (currentDayStartIndex !== -1) {
          items[currentDayStartIndex] = { 
            type: 'header', 
            date: currentDate, 
            expenseTotalMinor: currentExpenseTotal,
            incomeTotalMinor: currentIncomeTotal,
          };
        }
        currentDate = tx.occurredAt;
        currentExpenseTotal = isIncome ? (0 as Minor) : tx.totalMinor;
        currentIncomeTotal = isIncome ? tx.totalMinor : (0 as Minor);
        currentDayStartIndex = items.length;
        items.push({ 
          type: 'header', 
          date: currentDate, 
          expenseTotalMinor: 0 as Minor,
          incomeTotalMinor: 0 as Minor,
        });
      } else {
        if (isIncome) {
          currentIncomeTotal = (currentIncomeTotal + tx.totalMinor) as Minor;
        } else if (tx.type === 'expense') {
          currentExpenseTotal = (currentExpenseTotal + tx.totalMinor) as Minor;
        }
      }
      items.push({ type: 'row', tx, versionCount: versionCounts.get(tx.txId) || 1 });
    }

    if (currentDayStartIndex !== -1) {
      items[currentDayStartIndex] = { 
        type: 'header', 
        date: currentDate, 
        expenseTotalMinor: currentExpenseTotal,
        incomeTotalMinor: currentIncomeTotal,
      };
    }

    return items;
  }, [filteredTxs, versionCounts]);

  const stickyHeaderIndices = useMemo(() => {
    const indices: number[] = [];
    listData.forEach((item, index) => {
      if (item.type === 'header') {
        indices.push(index);
      }
    });
    return indices;
  }, [listData]);

  const handleDelete = (tx: TxVersion) => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          const tombstone = createTx({
            txId: tx.txId,
            occurredAt: tx.occurredAt,
            accountId: tx.accountId,
            payee: tx.payee,
            note: tx.note,
            lines: tx.lines,
            isDeleted: true,
          });
          appendTx.mutate(tombstone);
          setSelectedTx(null);
        }
      }
    ]);
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.categoryId === categoryId);
    if (!cat) return categoryId;
    if (cat.parentId) {
      const parent = categories.find(c => c.categoryId === cat.parentId);
      if (parent) return `${parent.name} - ${cat.name}`;
    }
    return cat.name;
  };

  const handleEdit = (tx: TxVersion) => {
    setSelectedTx(null);
    router.push({ pathname: '/entry', params: { txId: tx.txId } });
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <LedgerDailyHeader 
          date={item.date} 
          incomeTotalMinor={item.incomeTotalMinor} 
          expenseTotalMinor={item.expenseTotalMinor} 
        />
      );
    }

    return (
      <LedgerRow 
        tx={item.tx} 
        versionCount={item.versionCount} 
        accounts={accounts} 
        categories={categories} 
        onPress={setSelectedTx} 
      />
    );
  };

  return (
    <View className="flex-1 bg-surface w-full h-full">
      <View className="px-4 py-4 bg-surface border-b border-surface-variant z-10">
        <MonthSwiper
          monthName={monthName}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
        <MonthTotals
          monthIncome={monthIncome}
          monthExpense={monthExpense}
          monthTotal={monthTotal}
        />
      </View>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `header-${item.date}` : `tx-${item.tx.rowId}-${index}`
        }
        stickyHeaderIndices={stickyHeaderIndices}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8 mt-10">
            <Text className="text-on-surface-variant">No transactions yet.</Text>
          </View>
        }
      />

      <Modal
        transparent
        animationType="slide"
        visible={!!selectedTx}
        onRequestClose={() => setSelectedTx(null)}
      >
        {selectedTx && (
          <Pressable 
            className="flex-1 bg-black/60 justify-end"
            onPress={() => setSelectedTx(null)}
          >
            <Pressable 
              className="bg-surface-container-highest rounded-t-3xl p-6 pb-10"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="items-center mb-6">
                <View className="w-12 h-1 bg-outline rounded-full" />
              </View>

              <Text className="text-on-surface text-xl font-semibold mb-1 text-center font-mono">
                {selectedTx.type === 'income' ? '+' : ''}{formatMinor(selectedTx.totalMinor, CURRENCY_CONFIG)}
              </Text>
              <Text className="text-on-surface-variant text-sm mb-8 text-center font-sans">
                {selectedTx.type === 'transfer' 
                  ? `${accounts.find(a => a.accountId === selectedTx.accountId)?.name || selectedTx.accountId} → ${accounts.find(a => a.accountId === selectedTx.transferAccountId)?.name || selectedTx.transferAccountId}`
                  : `${accounts.find(a => a.accountId === selectedTx.accountId)?.name || selectedTx.accountId} • ${selectedTx.occurredAt} • ${selectedTx.type === 'income' ? '💰 ' : ''}${selectedTx.lines.length > 1 ? 'Split' : getCategoryName(selectedTx.lines[0]?.categoryId)}`
                }
              </Text>

              <View className="gap-3">
                <Pressable
                  className="bg-primary py-3.5 rounded-full items-center"
                  onPress={() => handleEdit(selectedTx)}
                >
                  <Text className="text-on-primary font-semibold text-base font-sans">Edit</Text>
                </Pressable>
                
                <Pressable
                  className="bg-surface-container-highest border border-error py-3.5 rounded-full items-center"
                  onPress={() => handleDelete(selectedTx)}
                >
                  <Text className="text-error font-semibold text-base font-sans">Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </Modal>
    </View>
  );
}
