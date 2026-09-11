import { Pressable, Text, View } from 'react-native';

export function RecurrenceTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: 'repeat' | 'installment';
  onTabChange: (tab: 'repeat' | 'installment') => void;
}) {
  return (
    <View className="flex-row justify-between mb-6 bg-surface-container p-1 rounded-xl">
      {(['repeat', 'installment'] as const).map((tab) => {
        const isSelected = activeTab === tab;
        const label = tab === 'repeat' ? 'Repeat' : 'Installments';
        return (
          <Pressable
            key={tab}
            className={`flex-1 py-2 items-center rounded-lg ${isSelected ? 'bg-primary' : 'bg-transparent'}`}
            onPress={() => onTabChange(tab)}
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
  );
}
