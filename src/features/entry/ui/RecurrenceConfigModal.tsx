import { RecurrenceMode } from '@/kernel';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

interface RecurrenceConfigModalProps {
  visible: boolean;
  mode: RecurrenceMode | 'none';
  dayOfMonth: number;
  installmentCount: number;
  onClose: () => void;
  onConfirm: (config: { mode: RecurrenceMode | 'none'; dayOfMonth: number; installmentCount: number }) => void;
}

export function RecurrenceConfigModal({
  visible,
  mode: initialMode,
  dayOfMonth: initialDayOfMonth,
  installmentCount: initialInstallmentCount,
  onClose,
  onConfirm,
}: RecurrenceConfigModalProps) {
  const [localMode, setLocalMode] = useState<RecurrenceMode | 'none'>(initialMode);
  const [localDayOfMonth, setLocalDayOfMonth] = useState(initialDayOfMonth.toString());
  const [localInstallmentCount, setLocalInstallmentCount] = useState(initialInstallmentCount.toString());

  if (!visible) return null;

  const handleConfirm = () => {
    let day = parseInt(localDayOfMonth, 10);
    if (isNaN(day) || day < 1) day = 1;
    if (day > 28) day = 28;

    let count = parseInt(localInstallmentCount, 10);
    if (isNaN(count) || count < 1) count = 1;

    onConfirm({ mode: localMode, dayOfMonth: day, installmentCount: count });
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
        <Pressable
          className="bg-surface-container-highest rounded-t-3xl p-6 pb-10"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center mb-6">
            <View className="w-12 h-1 bg-outline rounded-full" />
          </View>

          <Text className="text-on-surface text-xl font-semibold mb-6 text-center">
            How should this repeat?
          </Text>

          <View className="flex-row justify-between mb-6 bg-surface-container p-1 rounded-xl">
            {(['none', 'recurring', 'installment'] as const).map((m) => {
              const isSelected = localMode === m;
              const label = m === 'none' ? 'Once' : m === 'recurring' ? 'Monthly' : 'Installments';
              return (
                <Pressable
                  key={m}
                  className={`flex-1 py-2 items-center rounded-lg ${isSelected ? 'bg-primary' : 'bg-transparent'}`}
                  onPress={() => setLocalMode(m)}
                >
                  <Text className={`font-semibold ${isSelected ? 'text-on-primary' : 'text-on-surface-variant'}`}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {localMode !== 'none' && (
            <View className="mb-6 gap-y-4">
              <View className="flex-row justify-between items-center bg-surface p-4 rounded-xl">
                <Text className="text-on-surface text-base">Repeats on day [1-28]</Text>
                <TextInput
                  className="bg-surface-container text-on-surface text-center p-2 rounded-lg w-16 text-lg font-mono"
                  keyboardType="number-pad"
                  value={localDayOfMonth}
                  onChangeText={setLocalDayOfMonth}
                  maxLength={2}
                />
              </View>

              {localMode === 'installment' && (
                <View className="flex-row justify-between items-center bg-surface p-4 rounded-xl">
                  <Text className="text-on-surface text-base">Number of installments</Text>
                  <TextInput
                    className="bg-surface-container text-on-surface text-center p-2 rounded-lg w-16 text-lg font-mono"
                    keyboardType="number-pad"
                    value={localInstallmentCount}
                    onChangeText={setLocalInstallmentCount}
                    maxLength={3}
                  />
                </View>
              )}
            </View>
          )}

          <Pressable
            className="bg-primary py-4 rounded-full items-center mt-2"
            onPress={handleConfirm}
          >
            <Text className="text-on-primary font-semibold text-lg">Confirm</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
