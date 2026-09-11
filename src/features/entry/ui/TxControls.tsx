import type { RecurrenceMode, TxType } from '@/kernel';
import { Pressable, Text, TextInput, View } from 'react-native';

interface TxControlsProps {
  txType: TxType;
  date: string;
  accountId: string;
  transferAccountId: string;
  accounts: { accountId: string; name: string; order: number }[];
  showDetails: boolean;
  payee: string;
  note: string;
  recurrenceMode: RecurrenceMode | 'none';
  onPressDate: () => void;
  onPressAccount: () => void;
  onPressTransferAccount: () => void;
  onToggleDetails: () => void;
  onChangePayee: (val: string) => void;
  onChangeNote: (val: string) => void;
  onPressRecurrence: () => void;
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
  recurrenceMode,
  onPressDate,
  onPressAccount,
  onPressTransferAccount,
  onToggleDetails,
  onChangePayee,
  onChangeNote,
  onPressRecurrence,
}: TxControlsProps) {
  const displayDateStr = date === new Date().toISOString().split('T')[0] ? 'Today' : date.slice(5);

  return (
    <View>
      <View className="flex-row items-center justify-between flex-wrap gap-y-2">
        <View className="flex-row items-center gap-2 flex-wrap">
          <Pressable
            onPress={onPressDate}
            className="bg-surface-container px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
          >
            <Text className="text-on-surface-variant font-medium text-sm">
              📅 {displayDateStr}
            </Text>
          </Pressable>

          <Pressable
            onPress={onPressAccount}
            className="bg-surface-container px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
          >
            <Text className="text-on-surface-variant font-medium text-sm">
              🏦 {accounts.find(a => a.accountId === accountId)?.name || 'Select Account'}
            </Text>
          </Pressable>

          {txType === 'transfer' && (
            <View className="flex-row items-center gap-2">
              <Text className="text-on-surface-variant">→</Text>
              <Pressable
                onPress={onPressTransferAccount}
                className="bg-surface-container px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
              >
                <Text className="text-on-surface-variant font-medium text-sm">
                  🏦 {accounts.find(a => a.accountId === transferAccountId)?.name || 'To Account'}
                </Text>
              </Pressable>
            </View>
          )}

          {txType !== 'transfer' && (
            <Pressable
              onPress={onPressRecurrence}
              className="bg-surface-container px-3 py-1.5 rounded-lg min-h-[36px] justify-center"
            >
              <Text className="text-on-surface-variant font-medium text-sm">
                🔁 {recurrenceMode === 'none' ? 'Once' : recurrenceMode === 'recurring' ? 'Monthly' : 'Installments'}
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={onToggleDetails}
          className="py-2 min-h-[36px] justify-center"
        >
          <Text className="text-on-surface-variant font-medium text-sm">
            {showDetails ? '- hide details' : '+ details'}
          </Text>
        </Pressable>
      </View>

      {showDetails && (
        <View className="mt-3 gap-y-2">
          <TextInput
            className="bg-surface-container text-on-surface placeholder:text-[#64748b] p-3 rounded-xl min-h-[44px]"
            placeholder="Payee"
            value={payee}
            onChangeText={onChangePayee}
          />
          <TextInput
            className="bg-surface-container text-on-surface placeholder:text-[#64748b] p-3 rounded-xl min-h-[44px]"
            placeholder="Note"
            value={note}
            onChangeText={onChangeNote}
          />
        </View>
      )}
    </View>
  );
}
