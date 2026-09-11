import type { TxLine, TxType, TxVersion } from '@/kernel';
import { Minor } from '@/kernel/money';
import { Alert, Pressable, Text, View } from 'react-native';
import { CategoryGrid } from './CategoryGrid';
import { SplitEditor } from './SplitEditor';

interface TransactionEditorProps {
  txType: TxType;
  isSplit: boolean;
  initialSplitCategoryIds: string[];
  amountMinor: Minor;
  transferAccountId: string;
  initialLines?: readonly TxLine[];
  onSaveTransfer: () => void;
  onSaveLines: (lines: TxLine[]) => void;
  onSetIsSplit: (isSplit: boolean, categoryIds?: string[]) => void;
  onSaveCategory: (categoryId: string) => void;
}

export function TransactionEditor({
  txType,
  isSplit,
  initialSplitCategoryIds,
  amountMinor,
  transferAccountId,
  initialLines,
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
          className={`rounded py-4 mx-1 items-center bg-surface-container`}
        >
          <Text className={`text-base font-semibold ${canSave ? 'text-on-surface' : 'text-on-surface-variant'}`}>
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
        initialCategoryIds={initialSplitCategoryIds}
        initialLines={initialLines}
        onSave={onSaveLines}
        onCancel={() => onSetIsSplit(false, [])}
      />
    );
  }

  return (
    <CategoryGrid
      txType={txType}
      selectedCategoryId={!isSplit && initialLines?.length === 1 ? initialLines[0].categoryId : undefined}
      onSelectCategory={onSaveCategory}
      onSplit={(categories) => {
        if (amountMinor <= 0) {
          Alert.alert('Amount Required', 'Please enter an amount first');
          return false;
        }
        onSetIsSplit(true, categories);
        return true;
      }}
    />
  );
}
