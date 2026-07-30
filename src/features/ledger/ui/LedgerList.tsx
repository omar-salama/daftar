import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks';
import { Minor, TxVersion } from '@/kernel';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { createTxVersion, useAppendTx, useLedger, useLedgerAllVersions } from '../hooks/useLedger';
import { useMonthlyLedger } from '../hooks/useMonthlyLedger';
import { LedgerDailyHeader } from './LedgerDailyHeader';
import { LedgerDetailsModal } from './LedgerDetailsModal';
import { LedgerRow } from './LedgerRow';
import { MonthSwiper } from './MonthSwiper';
import { MonthTotals } from './MonthTotals';

type ListItem =
  | { type: 'header'; date: string; expenseTotalMinor: Minor; incomeTotalMinor: Minor }
  | { type: 'row'; tx: TxVersion; versionCount: number; lineIndex?: number };

export function LedgerList({ accountId }: { accountId?: string } = {}) {
  const { data: currentTxs = [] } = useLedger();
  const { data: allVersions = [] } = useLedgerAllVersions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const appendTx = useAppendTx();
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

      if (tx.lines.length > 1 && tx.type !== 'transfer') {
        tx.lines.forEach((line, index) => {
          items.push({ type: 'row', tx, versionCount: versionCounts.get(tx.txId) || 1, lineIndex: index });
        });
      } else {
        items.push({ type: 'row', tx, versionCount: versionCounts.get(tx.txId) || 1 });
      }
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
          const tombstone = createTxVersion({
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
        lineIndex={item.lineIndex}
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
          item.type === 'header' ? `header-${item.date}` : `tx-${item.tx.rowId}-${item.lineIndex ?? 'all'}-${index}`
        }
        stickyHeaderIndices={stickyHeaderIndices}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8 mt-10">
            <Text className="text-on-surface-variant">No transactions yet.</Text>
          </View>
        }
      />

      <LedgerDetailsModal
        selectedTx={selectedTx}
        accounts={accounts}
        categories={categories}
        onClose={() => setSelectedTx(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </View>
  );
}
