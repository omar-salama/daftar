import { AccountVersion } from '@/features/accounts/model';
import { CategoryVersion } from '@/features/categories/model';
import { TxVersion } from '@/kernel';
import { formatMinor, DEFAULT_CURRENCY } from '@/kernel/money';
import { Pressable, Text, View } from 'react-native';

interface LedgerRowProps {
  tx: TxVersion;
  versionCount: number;
  accounts: AccountVersion[];
  categories: CategoryVersion[];
  onPress: (tx: TxVersion) => void;
}

export function LedgerRow({ tx, versionCount, accounts, categories, onPress }: LedgerRowProps) {
  const isTransfer = tx.type === 'transfer';
  const catObj = categories.find(c => c.categoryId === tx.lines[0]?.categoryId);
  const parentObj = catObj?.parentId ? categories.find(c => c.categoryId === catObj.parentId) : null;
  const categoryName = isTransfer ? 'Transfer' : 
    (catObj ? (parentObj ? `${parentObj.name} - ${catObj.name}` : catObj.name) : (tx.lines[0]?.categoryId || 'Unknown'));
  const isSplit = tx.lines.length > 1;
  const isExpense = tx.type === 'expense';

  const accountName = accounts.find(a => a.accountId === tx.accountId)?.name || tx.accountId;
  const transferAccountName = isTransfer && tx.transferAccountId
    ? (accounts.find(a => a.accountId === tx.transferAccountId)?.name || tx.transferAccountId)
    : undefined;
  const subtitle = isTransfer
    ? `${accountName} → ${transferAccountName}`
    : [accountName, tx.payee, tx.note].filter(Boolean).join(' • ');

  const icon = isTransfer ? '⇄' : (isSplit ? '➗' : (catObj?.icon || '🪙'));

  return (
    <Pressable
      onPress={() => onPress(tx)}
      className="flex-row items-center px-4 py-2 bg-surface border-b border-surface-container-low active:bg-surface-container-high"
    >
      <View className="w-10 h-10 bg-surface-container rounded items-center justify-center mr-3 border border-surface-variant">
        <Text className="text-xl">{icon}</Text>
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-on-surface font-sans text-base">
            {isSplit && !isTransfer ? 'Split' : categoryName}
          </Text>
          {versionCount > 1 && (
            <Text className="text-primary text-sm font-bold">*</Text>
          )}
        </View>
        <Text className="text-on-surface-variant text-sm mt-0.5 font-sans" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text className={`text-base font-mono ${isExpense ? 'text-error' : isTransfer ? 'text-on-surface' : 'text-secondary'}`}>
        {formatMinor(tx.totalMinor, DEFAULT_CURRENCY)}
      </Text>
    </Pressable>
  );
}

