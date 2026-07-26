import { Pressable, Text, View } from 'react-native';
import type { TxLine, TxType, TxVersion } from '@/kernel';
import { Minor } from '@/kernel/money';
import { SplitEditor } from './SplitEditor';
import { CategoryGrid } from './CategoryGrid';

interface TransactionEditorProps {
  txType: TxType;
  isSplit: boolean;
  amountMinor: Minor;
  transferAccountId: string;
  editingTx?: TxVersion;
  onSaveTransfer: () => void;
  onSaveLines: (lines: TxLine[]) => void;
  onSetIsSplit: (isSplit: boolean) => void;
  onSaveCategory: (categoryId: string) => void;
}

export function TransactionEditor({
  txType,
  isSplit,
  amountMinor,
  transferAccountId,
  editingTx,
  onSaveTransfer,
  onSaveLines,
  onSetIsSplit,
  onSaveCategory,
}: TransactionEditorProps) {
  if (txType === 'transfer') {
    const canSave = amountMinor > 0 && transferAccountId !== '';
    return (
      <View>
        <Pressable
          onPress={onSaveTransfer}
          disabled={!canSave}
          className={`rounded-xl py-4 items-center bg-surface-elevated`}
        >
          <Text className={`text-base font-semibold ${canSave ? 'text-foreground' : 'text-foreground-muted'}`}>
            Save Transfer
          </Text>
        </Pressable>
      </View>
    );
  }

  if (isSplit && txType === 'expense') {
    return (
      <SplitEditor
        totalMinor={amountMinor}
        onSave={onSaveLines}
        onCancel={() => onSetIsSplit(false)}
      />
    );
  }

  return (
    <CategoryGrid
      txType={txType}
      selectedCategoryId={!isSplit && editingTx?.lines?.length === 1 ? editingTx.lines[0].categoryId : undefined}
      onSelectCategory={onSaveCategory}
      onSplit={() => {
        if (amountMinor > 0) onSetIsSplit(true);
      }}
    />
  );
}
