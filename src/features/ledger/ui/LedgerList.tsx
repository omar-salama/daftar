import { Minor, TxVersion } from '@/kernel';
import { formatMinor } from '@/kernel/money';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useAppendTx, useCreateTx, useLedger, useLedgerAllVersions } from '../hooks/useLedger';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useCategories } from '@/features/categories/hooks';

// We need a generic currency config for formatting.
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

  const versionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of allVersions) {
      counts.set(v.txId, (counts.get(v.txId) || 0) + 1);
    }
    return counts;
  }, [allVersions]);

  const filteredTxs = useMemo(() => {
    if (!accountId) return currentTxs;
    return currentTxs.filter(tx => tx.accountId === accountId || tx.transferAccountId === accountId);
  }, [currentTxs, accountId]);

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
  }, [currentTxs, versionCounts]);

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

  const handleEdit = (tx: TxVersion) => {
    setSelectedTx(null);
    router.push({ pathname: '/entry', params: { txId: tx.txId } });
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      const hasIncome = item.incomeTotalMinor > 0;
      const hasExpense = item.expenseTotalMinor > 0;

      return (
        <View className="flex-row justify-between items-center px-4 py-2.5 bg-surface-elevated border-b border-border-strong">
          <Text className="text-foreground-secondary font-medium text-xs">{item.date}</Text>
          <View className="flex-row items-center">
            <Text
              className={`w-24 text-right font-medium text-sm ${hasIncome ? 'text-success' : 'text-foreground-muted'}`}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              +{formatMinor(item.incomeTotalMinor, CURRENCY_CONFIG)}
            </Text>
            <Text
              className={`w-24 text-right font-medium text-sm pl-2 ${hasExpense ? 'text-foreground-secondary' : 'text-foreground-muted'}`} 
              numberOfLines={1} 
              adjustsFontSizeToFit
            >
              {formatMinor(item.expenseTotalMinor, CURRENCY_CONFIG)}
            </Text>
          </View>
        </View>
      );
    }

    const { tx, versionCount } = item;
    const isTransfer = tx.type === 'transfer';
    const catObj = categories.find(c => c.categoryId === tx.lines[0]?.categoryId);
    const categoryName = isTransfer ? 'Transfer' : (catObj ? catObj.name : (tx.lines[0]?.categoryId || 'Unknown'));
    const isSplit = tx.lines.length > 1;
    const isIncome = tx.type === 'income';

    const accountName = accounts.find(a => a.accountId === tx.accountId)?.name || tx.accountId;
    const transferAccountName = isTransfer && tx.transferAccountId 
       ? (accounts.find(a => a.accountId === tx.transferAccountId)?.name || tx.transferAccountId) 
       : undefined;
    const subtitle = isTransfer 
       ? `${accountName} → ${transferAccountName}`
       : [accountName, tx.payee, tx.note].filter(Boolean).join(' • ');

    return (
      <Pressable 
        onPress={() => setSelectedTx(tx)}
        className="flex-row justify-between items-center px-4 py-3 bg-surface border-b border-border active:bg-surface-hover"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="text-foreground text-base">
              {isSplit && !isTransfer ? 'Split' : categoryName}
            </Text>
            {versionCount > 1 && (
              <Text className="text-brand text-sm font-bold">*</Text>
            )}
          </View>
          <Text className="text-foreground-muted text-sm mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Text className={`text-base ${isIncome ? 'text-success' : isTransfer ? 'text-info' : 'text-foreground'}`}>
          {isIncome ? '+' : ''}{formatMinor(tx.totalMinor, CURRENCY_CONFIG)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-surface w-full h-full">
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `header-${item.date}` : `tx-${item.tx.rowId}-${index}`
        }
        stickyHeaderIndices={stickyHeaderIndices}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8 mt-10">
            <Text className="text-foreground-muted">No transactions yet.</Text>
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
            className="flex-1 bg-surface-overlay justify-end"
            onPress={() => setSelectedTx(null)}
          >
            <Pressable 
              className="bg-surface-elevated rounded-t-3xl p-6 pb-10"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="items-center mb-6">
                <View className="w-12 h-1 bg-border rounded-full" />
              </View>

              <Text className="text-foreground text-xl font-semibold mb-1 text-center">
                {selectedTx.type === 'income' ? '+' : ''}{formatMinor(selectedTx.totalMinor, CURRENCY_CONFIG)}
              </Text>
              <Text className="text-foreground-secondary text-sm mb-8 text-center">
                {selectedTx.type === 'transfer' 
                  ? `${accounts.find(a => a.accountId === selectedTx.accountId)?.name || selectedTx.accountId} → ${accounts.find(a => a.accountId === selectedTx.transferAccountId)?.name || selectedTx.transferAccountId}`
                  : `${accounts.find(a => a.accountId === selectedTx.accountId)?.name || selectedTx.accountId} • ${selectedTx.occurredAt} • ${selectedTx.type === 'income' ? '💰 ' : ''}${selectedTx.lines.length > 1 ? 'Split' : (categories.find(c => c.categoryId === selectedTx.lines[0]?.categoryId)?.name || selectedTx.lines[0]?.categoryId)}`
                }
              </Text>

              <View className="gap-3">
                <Pressable
                  className="bg-brand py-3.5 rounded-xl items-center"
                  onPress={() => handleEdit(selectedTx)}
                >
                  <Text className="text-surface font-semibold text-base">Edit</Text>
                </Pressable>
                
                <Pressable
                  className="bg-surface border border-danger py-3.5 rounded-xl items-center"
                  onPress={() => handleDelete(selectedTx)}
                >
                  <Text className="text-danger font-semibold text-base">Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </Modal>
    </View>
  );
}
