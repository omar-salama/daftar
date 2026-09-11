import { RecurrenceMode, RecurrenceFrequency } from '@/kernel';
import { useState, useRef } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

interface RecurrenceConfigModalProps {
  visible: boolean;
  mode: RecurrenceMode | 'none';
  frequency: RecurrenceFrequency | 'none';
  installmentCount: number;
  onClose: () => void;
  onConfirm: (config: {
    mode: RecurrenceMode | 'none';
    frequency: RecurrenceFrequency | 'none';
    installmentCount: number;
  }) => void;
}

export function RecurrenceConfigModal({
  visible,
  mode: initialMode,
  frequency: initialFrequency,
  installmentCount: initialInstallmentCount,
  onClose,
  onConfirm,
}: RecurrenceConfigModalProps) {
  // We combine 'none' and 'recurring' into a single 'repeat' tab
  const initialTab = initialMode === 'installment' ? 'installment' : 'repeat';
  const [activeTab, setActiveTab] = useState<'repeat' | 'installment'>(
    initialTab,
  );

  // local frequency can be 'none' when in 'repeat' tab
  const [localFrequency, setLocalFrequency] = useState(
    initialMode === 'none' ? 'none' : initialFrequency,
  );
  const [localInstallmentCount, setLocalInstallmentCount] = useState(
    initialInstallmentCount.toString(),
  );

  const adjustInterval = useRef<NodeJS.Timeout | null>(null);

  const adjustInstallments = (delta: number) => {
    setLocalInstallmentCount((prev) => {
      let current = parseInt(prev, 10);
      if (isNaN(current)) current = 1;
      const next = Math.max(1, current + delta);
      return next.toString();
    });
  };

  const startAdjusting = (delta: number) => {
    if (adjustInterval.current) return;
    adjustInterval.current = setInterval(() => {
      adjustInstallments(delta * 6);
    }, 250);
  };

  const stopAdjusting = () => {
    if (adjustInterval.current) {
      clearInterval(adjustInterval.current);
      adjustInterval.current = null;
    }
  };

  if (!visible) return null;

  const handleConfirm = () => {
    let count = parseInt(localInstallmentCount, 10);
    if (isNaN(count) || count < 1) count = 1;

    if (activeTab === 'installment') {
      onConfirm({
        mode: 'installment',
        frequency: 'monthly',
        installmentCount: count,
      });
    } else {
      if (localFrequency === 'none') {
        onConfirm({
          mode: 'none',
          frequency: 'monthly',
          installmentCount: count,
        });
      } else {
        onConfirm({
          mode: 'recurring',
          frequency: localFrequency,
          installmentCount: count,
        });
      }
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
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
            {(['repeat', 'installment'] as const).map((tab) => {
              const isSelected = activeTab === tab;
              const label = tab === 'repeat' ? 'Repeat' : 'Installments';
              return (
                <Pressable
                  key={tab}
                  className={`flex-1 py-2 items-center rounded-lg ${isSelected ? 'bg-primary' : 'bg-transparent'}`}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    className={`font-semibold ${isSelected ? 'text-on-primary' : 'text-on-surface-variant'}`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="h-40 gap-y-4 -mx-1">
            {activeTab === 'repeat' && (
              <View className="flex-row flex-wrap">
                {(
                  ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const
                ).map((freq) => {
                  const isSelected = localFrequency === freq;
                  return (
                    <View key={freq} className="w-1/3 pb-2 px-1">
                      <Pressable
                        className={`px-4 py-3 rounded-xl border ${isSelected ? 'border-primary bg-primary/10' : 'border-outline bg-surface'}`}
                        onPress={() => setLocalFrequency(freq)}
                      >
                        <Text
                          className={`text-center font-medium ${isSelected ? 'text-primary' : 'text-on-surface'}`}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}

            {activeTab === 'installment' && (
              <View className="gap-y-4 px-1">
                <View className="flex-row gap-2">
                  {[3, 6, 12, 24].map(preset => {
                     const isSelected = parseInt(localInstallmentCount, 10) === preset;
                     return (
                       <Pressable
                         key={preset}
                         className={`flex-1 py-3 rounded-xl border items-center ${isSelected ? 'border-primary bg-primary/10' : 'border-outline bg-surface'}`}
                         onPress={() => setLocalInstallmentCount(preset.toString())}
                       >
                         <Text className={`font-medium ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{preset}</Text>
                       </Pressable>
                     );
                  })}
                </View>
                <View className="flex-row justify-between items-center bg-surface p-4 rounded-xl">
                  <Text className="text-on-surface text-base">
                    Adjust number:
                  </Text>
                  
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      className="w-10 h-10 bg-surface-container rounded-full items-center justify-center"
                      onPress={() => adjustInstallments(-1)}
                      onLongPress={() => startAdjusting(-1)}
                      onPressOut={stopAdjusting}
                      delayLongPress={400}
                    >
                      <Text className="text-on-surface text-xl font-bold">-</Text>
                    </Pressable>
                    
                    <TextInput
                      className="text-on-surface text-center text-lg font-mono min-w-[32px] p-0"
                      keyboardType="number-pad"
                      value={localInstallmentCount}
                      onChangeText={setLocalInstallmentCount}
                      maxLength={3}
                    />
                    
                    <Pressable
                      className="w-10 h-10 bg-surface-container rounded-full items-center justify-center"
                      onPress={() => adjustInstallments(1)}
                      onLongPress={() => startAdjusting(1)}
                      onPressOut={stopAdjusting}
                      delayLongPress={400}
                    >
                      <Text className="text-on-surface text-xl font-bold">+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          </View>

          <Pressable
            className="bg-primary py-4 rounded-full items-center mt-2"
            onPress={handleConfirm}
          >
            <Text className="text-on-primary font-semibold text-lg">
              Confirm
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
