import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface ParentCategoryPickerModalProps {
  visible: boolean;
  categories: { categoryId: string; name: string; icon: string; order?: number }[];
  onClose: () => void;
  onSelect: (categoryId: string | null) => void;
}

export function ParentCategoryPickerModal({
  visible,
  categories,
  onClose,
  onSelect
}: ParentCategoryPickerModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center"
        onPress={onClose}
      >
        <View className="w-[80%] max-h-[80%] bg-surface-container rounded-2xl p-4 gap-3 border border-outline">
          <Text className="text-on-surface text-lg font-semibold text-center mb-1">Select Parent</Text>
          
          <ScrollView className="flex-grow-0" showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              className="bg-surface-container-high p-3.5 rounded-lg flex-row items-center mb-2"
            >
              <Text className="text-on-surface text-base font-medium flex-1 text-center">None (Top Level)</Text>
            </Pressable>
            
            {categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((cat) => (
              <Pressable
                key={cat.categoryId}
                onPress={() => {
                  onSelect(cat.categoryId);
                  onClose();
                }}
                className="bg-surface-container-high p-3.5 rounded-lg flex-row items-center mb-2 gap-3"
              >
                <Text className="text-2xl">{cat.icon}</Text>
                <Text className="text-on-surface text-base font-medium flex-1">{cat.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}
