import { RecurrenceFrequency, RecurrenceMode } from '@/kernel';
import { useState } from 'react';
import { Modal, Pressable, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { InstallmentOptions } from './InstallmentOptions';
import { RecurrenceTabs } from './RecurrenceTabs';
import { RepeatOptions } from './RepeatOptions';

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
  const [activeTab, setActiveTab] = useState<'repeat' | 'installment'>(
    initialMode === 'installment' ? 'installment' : 'repeat',
  );

  const [localFrequency, setLocalFrequency] = useState(
    initialMode === 'none' ? 'none' : initialFrequency,
  );

  const [localInstallmentCount, setLocalInstallmentCount] = useState(
    initialInstallmentCount.toString(),
  );

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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={onClose}>
          <Pressable
            className="bg-surface-container rounded-t-3xl p-6 pb-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-outline rounded-full" />
            </View>

            <Text className="text-on-surface text-xl font-semibold mb-6 text-center">
              How should this repeat?
            </Text>

            <RecurrenceTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <View className="h-40 gap-y-4 -mx-1">
              {activeTab === 'repeat' && (
                <RepeatOptions
                  localFrequency={localFrequency}
                  setLocalFrequency={setLocalFrequency}
                />
              )}

              {activeTab === 'installment' && (
                <InstallmentOptions
                  localInstallmentCount={localInstallmentCount}
                  setLocalInstallmentCount={setLocalInstallmentCount}
                />
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
