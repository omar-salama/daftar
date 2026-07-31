import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';

interface DatePickerModalProps {
  visible: boolean;
  currentDate?: string;
  onClose: () => void;
  onSelectDate: (date: string) => void;
}

export function DatePickerModal({ visible, currentDate, onClose, onSelectDate }: DatePickerModalProps) {
  const [date, setDate] = useState(() => {
    if (currentDate) {
      const [y, m, d] = currentDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });

  useEffect(() => {
    if (currentDate) {
      const [y, m, d] = currentDate.split('-').map(Number);
      setDate(new Date(y, m - 1, d));
    }
  }, [currentDate]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      onClose(); // Android dismisses modal on selection or cancel
      if (event.type === 'set' && selectedDate) {
        setDate(selectedDate);
        onSelectDate(
          `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        );
      }
    } else {
      if (selectedDate) {
        setDate(selectedDate);
        onSelectDate(
          `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        );
      }
    }
  };

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        onChange={handleDateChange}
      />
    );
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center"
        onPress={onClose}
      >
        <View 
          className="w-[90%] bg-surface-container rounded-2xl p-4 gap-3 border border-outline"
          onStartShouldSetResponder={() => true}
        >
          <Text className="text-on-surface text-lg font-semibold text-center mb-1">Select Date</Text>
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            onChange={handleDateChange}
          />
          <Pressable
            onPress={onClose}
            className="bg-primary p-3 rounded-lg items-center mt-2"
          >
            <Text className="text-on-primary text-base font-semibold">Done</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
