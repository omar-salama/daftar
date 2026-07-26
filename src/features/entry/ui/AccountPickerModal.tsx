import { Modal, Pressable, Text, View } from 'react-native';

interface AccountPickerModalProps {
  visible: boolean;
  title: string;
  accounts: { accountId: string; name: string; order: number }[];
  onClose: () => void;
  onSelectAccount: (accountId: string) => void;
}

export function AccountPickerModal({
  visible,
  title,
  accounts,
  onClose,
  onSelectAccount
}: AccountPickerModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-surface-overlay justify-center items-center"
        onPress={onClose}
      >
        <View className="w-[80%] bg-surface-elevated rounded-2xl p-4 gap-3 border border-border-strong">
          <Text className="text-foreground text-lg font-semibold text-center mb-1">{title}</Text>
          {accounts.sort((a, b) => a.order - b.order).map((acc) => (
            <Pressable
              key={acc.accountId}
              onPress={() => {
                onSelectAccount(acc.accountId);
                onClose();
              }}
              className="bg-surface-hover p-3.5 rounded-lg items-center"
            >
              <Text className="text-foreground text-base font-medium">{acc.name}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
