import { Pressable, Text, TextInput, View } from 'react-native';
import type { TxType } from '@/kernel';

interface TxControlsProps {
  txType: TxType;
  date: string;
  accountId: string;
  transferAccountId: string;
  accounts: { accountId: string; name: string; order: number }[];
  showDetails: boolean;
  payee: string;
  note: string;
  onPressDate: () => void;
  onPressAccount: () => void;
  onPressTransferAccount: () => void;
  onToggleDetails: () => void;
  onChangePayee: (val: string) => void;
  onChangeNote: (val: string) => void;
}

export function TxControls({
  txType,
  date,
  accountId,
  transferAccountId,
  accounts,
  showDetails,
  payee,
  note,
  onPressDate,
  onPressAccount,
  onPressTransferAccount,
  onToggleDetails,
  onChangePayee,
  onChangeNote,
}: TxControlsProps) {
  const displayDateStr = date === new Date().toISOString().split('T')[0] ? 'Today' : date.slice(5);

  return (
    <View>
      <View className="flex-row items-center justify-between flex-wrap gap-y-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Pressable
            onPress={onPressDate}
            className="bg-surface-elevated px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
          >
            <Text className="text-foreground-secondary font-medium text-sm">
              📅 {displayDateStr}
            </Text>
          </Pressable>

          <Pressable
            onPress={onPressAccount}
            className="bg-surface-elevated px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
          >
            <Text className="text-foreground-secondary font-medium text-sm">
              🏦 {accounts.find(a => a.accountId === accountId)?.name || 'Select Account'}
            </Text>
          </Pressable>

          {txType === 'transfer' && (
            <View className="flex-row items-center gap-2">
              <Text className="text-foreground-muted">→</Text>
              <Pressable
                onPress={onPressTransferAccount}
                className="bg-surface-elevated px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
              >
                <Text className="text-foreground-secondary font-medium text-sm">
                  🏦 {accounts.find(a => a.accountId === transferAccountId)?.name || 'To Account'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          onPress={onToggleDetails}
          className="py-2 min-h-[36px] justify-center"
        >
          <Text className="text-foreground-muted font-medium text-sm">
            {showDetails ? '- hide details' : '+ details'}
          </Text>
        </Pressable>
      </View>

      {showDetails && (
        <View className="mt-3 gap-y-2">
          <TextInput
            className="bg-surface-elevated text-foreground placeholder:text-foreground-placeholder p-3 rounded-xl min-h-[44px]"
            placeholder="Payee"
            value={payee}
            onChangeText={onChangePayee}
          />
          <TextInput
            className="bg-surface-elevated text-foreground placeholder:text-foreground-placeholder p-3 rounded-xl min-h-[44px]"
            placeholder="Note"
            value={note}
            onChangeText={onChangeNote}
          />
        </View>
      )}
    </View>
  );
}
