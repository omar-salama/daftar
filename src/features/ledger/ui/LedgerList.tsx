import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, Modal } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useLedger, useLedgerAllVersions, useAppendTx, useCreateTx } from '../hooks/useLedger';
import { TxVersion, Minor } from '@/kernel';
import { formatMinor } from '@/kernel/money';

// We need a generic currency config for formatting.
const CURRENCY_CONFIG = { symbol: '$', decimals: 2 };

type ListItem = 
  | { type: 'header'; date: string; totalMinor: Minor }
  | { type: 'row'; tx: TxVersion; versionCount: number };

export function LedgerList() {
  const { data: currentTxs = [] } = useLedger();
  const { data: allVersions = [] } = useLedgerAllVersions();
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

  const listData = useMemo(() => {
    // Sort transactions descending by date, then by HLC version
    const sorted = [...currentTxs].sort((a, b) => {
      if (a.occurredAt !== b.occurredAt) {
        return b.occurredAt.localeCompare(a.occurredAt);
      }
      return b.version.localeCompare(a.version);
    });

    const items: ListItem[] = [];
    let currentDate = '';
    let currentDayTotal = 0 as Minor;
    let currentDayStartIndex = -1;

    for (const tx of sorted) {
      if (tx.occurredAt !== currentDate) {
        if (currentDayStartIndex !== -1) {
          items[currentDayStartIndex] = { 
            type: 'header', 
            date: currentDate, 
            totalMinor: currentDayTotal 
          };
        }
        currentDate = tx.occurredAt;
        currentDayTotal = tx.totalMinor;
        currentDayStartIndex = items.length;
        items.push({ type: 'header', date: currentDate, totalMinor: 0 as Minor });
      } else {
        currentDayTotal = (currentDayTotal + tx.totalMinor) as Minor;
      }
      items.push({ type: 'row', tx, versionCount: versionCounts.get(tx.txId) || 1 });
    }

    if (currentDayStartIndex !== -1) {
      items[currentDayStartIndex] = { 
        type: 'header', 
        date: currentDate, 
        totalMinor: currentDayTotal 
      };
    }

    return items;
  }, [currentTxs, versionCounts]);

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
      return (
        <View className="flex-row justify-between items-center px-4 py-2 bg-surface-elevated border-b border-border-strong mt-2">
          <Text className="text-foreground-secondary font-semibold">{item.date}</Text>
          <Text className="text-foreground-secondary font-semibold">
            {formatMinor(item.totalMinor, CURRENCY_CONFIG)}
          </Text>
        </View>
      );
    }

    const { tx, versionCount } = item;
    const categoryName = tx.lines[0]?.categoryId || 'Unknown';
    const isSplit = tx.lines.length > 1;

    return (
      <Pressable 
        onPress={() => setSelectedTx(tx)}
        className="flex-row justify-between items-center px-4 py-3 bg-surface border-b border-border active:bg-surface-hover"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground font-medium text-base">
              {isSplit ? 'Split' : categoryName}
            </Text>
            {versionCount > 1 && (
              <View className="bg-brand/20 px-1.5 py-0.5 rounded">
                <Text className="text-brand text-xs font-medium">edited</Text>
              </View>
            )}
          </View>
          {(tx.payee || tx.note) && (
            <Text className="text-foreground-muted text-sm mt-0.5" numberOfLines={1}>
              {[tx.payee, tx.note].filter(Boolean).join(' • ')}
            </Text>
          )}
        </View>
        <Text className="text-foreground font-semibold text-base">
          {formatMinor(tx.totalMinor, CURRENCY_CONFIG)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-surface w-full h-full">
      <FlashList
        data={listData}
        renderItem={renderItem}
        getItemType={(item) => item.type}
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
                {formatMinor(selectedTx.totalMinor, CURRENCY_CONFIG)}
              </Text>
              <Text className="text-foreground-secondary text-sm mb-8 text-center">
                {selectedTx.occurredAt} • {selectedTx.lines.length > 1 ? 'Split' : selectedTx.lines[0]?.categoryId}
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
