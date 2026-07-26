import { Pressable, Text, View } from 'react-native';
import type { TxType } from '@/kernel';

interface TxTypeToggleProps {
  txType: TxType;
  onChangeType: (type: TxType) => void;
}

export function TxTypeToggle({ txType, onChangeType }: TxTypeToggleProps) {
  return (
    <View className="flex-row items-center justify-center pt-3 pb-1">
      <View className="flex-row items-center bg-surface-elevated rounded-full px-1 py-1 border border-border">
        {(['expense', 'income', 'transfer'] as TxType[]).map((type) => (
          <Pressable
            key={type}
            onPress={() => onChangeType(type)}
            className={`px-4 py-1.5 rounded-full min-h-[36px] justify-center ${
              txType === type
                ? type === 'expense' ? 'bg-danger'
                  : type === 'income' ? 'bg-success'
                    : 'bg-surface-hover'
                : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold capitalize ${
                txType === type ? 'text-foreground' : 'text-foreground-muted'
              }`}
            >
              {type}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
