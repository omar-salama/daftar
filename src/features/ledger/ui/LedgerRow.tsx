import { Pressable, Text, View } from 'react-native';
import { TxVersion } from '@/kernel';
import { formatMinor } from '@/kernel/money';
import { AccountVersion } from '@/features/accounts/model';
import { CategoryVersion } from '@/features/categories/model';

const CURRENCY_CONFIG = { symbol: '$', decimals: 2 };

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
      onPress={() => onPress(tx)}
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
}
