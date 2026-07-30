import { AccountVersion } from '@/features/accounts/model';
import { CategoryVersion } from '@/features/categories/model';
import { TxVersion } from '@/kernel';
import { formatMinor, DEFAULT_CURRENCY } from '@/kernel/money';
import { Pressable, Text, View } from 'react-native';

interface LedgerRowProps {
  tx: TxVersion;
  versionCount: number;
  lineIndex?: number;
  accounts: AccountVersion[];
  categories: CategoryVersion[];
  onPress: (tx: TxVersion) => void;
}

export function LedgerRow({ tx, versionCount, lineIndex, accounts, categories, onPress }: LedgerRowProps) {
  const isTransfer = tx.type === 'transfer';
  const line = lineIndex !== undefined ? tx.lines[lineIndex] : tx.lines[0];
  const catObj = categories.find(c => c.categoryId === line?.categoryId);
  const parentObj = catObj?.parentId ? categories.find(c => c.categoryId === catObj.parentId) : null;
  const categoryName = isTransfer ? 'Transfer' : 
    (catObj ? (parentObj ? `${parentObj.name} - ${catObj.name}` : catObj.name) : (line?.categoryId || 'Unknown'));
  const isExpense = tx.type === 'expense';
  
  const displayMinor = lineIndex !== undefined ? line.amountMinor : tx.totalMinor;

  const accountName = accounts.find(a => a.accountId === tx.accountId)?.name || tx.accountId;
  const transferAccountName = isTransfer && tx.transferAccountId
    ? (accounts.find(a => a.accountId === tx.transferAccountId)?.name || tx.transferAccountId)
    : undefined;
    
  // If it's part of a split, maybe add a subtle visual hint in the subtitle
  const isPartOfSplit = tx.lines.length > 1 && lineIndex !== undefined;
  const subtitlePrefix = isPartOfSplit ? 'Part of Split • ' : '';
  
  const subtitle = isTransfer
    ? `${accountName} → ${transferAccountName}`
    : `${subtitlePrefix}${[accountName, tx.payee, tx.note].filter(Boolean).join(' • ')}`;

  const icon = isTransfer ? '⇄' : (catObj?.icon || '🪙');

  return (
    <Pressable
      onPress={() => onPress(tx)}
      className="flex-row items-center px-4 py-2 bg-surface border-b border-surface-container-low active:bg-surface-container-high"
    >
      <View className="w-10 h-10 bg-surface-container rounded items-center justify-center mr-3 border border-surface-variant relative">
        <Text className="text-xl">{icon}</Text>
        {isPartOfSplit && (
          <View className="absolute -top-1 -right-1 bg-surface-variant rounded-full w-4 h-4 items-center justify-center border border-surface">
            <Text className="text-[8px]">➗</Text>
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-on-surface font-sans text-base">
            {categoryName}
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
        {formatMinor(displayMinor, DEFAULT_CURRENCY)}
      </Text>
    </Pressable>
  );
}
