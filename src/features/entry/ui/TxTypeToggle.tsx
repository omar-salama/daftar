import type { TxType } from '@/kernel';
import { Pressable, Text, View } from 'react-native';

interface TxTypeToggleProps {
  txType: TxType;
  onChangeType: (type: TxType) => void;
}

export function TxTypeToggle({ txType, onChangeType }: TxTypeToggleProps) {
  return (
    <View className="flex-row items-center justify-center pt-3 pb-1">
      <View className="flex-row items-center bg-surface-container rounded-full px-1 py-1 border border-surface-variant">
        {(['expense', 'income', 'transfer'] as TxType[]).map((type) => (
          <Pressable
            key={type}
            onPress={() => onChangeType(type)}
            className={`px-4 py-1.5 rounded-full min-h-[36px] justify-center
              ${txType === type
                ? type === 'expense'
                  ? 'bg-error'
                  : type === 'income'
                    ? 'bg-secondary-container'
                    : 'bg-primary-container'
                : ''
              }`}
          >
            <Text
              className={`text-sm font-semibold capitalize
                ${txType === type
                  ? type === 'expense'
                    ? 'text-on-error'
                    : type === 'income'
                      ? 'text-on-secondary-container'
                      : 'text-on-primary-container'
                  : 'text-on-surface-variant'
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
