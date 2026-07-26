import { Modal, Pressable, Text, View } from 'react-native';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

export function DatePickerModal({ visible, onClose, onSelectDate }: DatePickerModalProps) {
  const getQuickDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    return [
      { label: 'Today', value: today.toISOString().split('T')[0] },
      { label: 'Yesterday', value: yesterday.toISOString().split('T')[0] },
      { label: dayBefore.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), value: dayBefore.toISOString().split('T')[0] },
    ];
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-surface-overlay justify-center items-center"
        onPress={onClose}
      >
        <View className="w-[80%] bg-surface-elevated rounded-2xl p-4 gap-3 border border-border-strong">
          <Text className="text-foreground text-lg font-semibold text-center mb-1">Select Date</Text>
          {getQuickDates().map((d) => (
            <Pressable
              key={d.value}
              onPress={() => {
                onSelectDate(d.value);
                onClose();
              }}
              className="bg-surface-hover p-3.5 rounded-lg items-center"
            >
              <Text className="text-foreground text-base font-medium">{d.label} ({d.value})</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
