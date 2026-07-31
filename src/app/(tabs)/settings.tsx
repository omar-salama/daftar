import { SettingRow } from '@/components/ui/SettingRow';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      <View className="p-4 border-b border-surface-container">
        <Text className="text-3xl font-bold text-on-surface">Settings</Text>
      </View>
      <ScrollView className="flex-1">
        <View className="border-surface-container">
          <SettingRow 
            label="Expense Categories" 
            href="/settings/categories?type=expense" 
          />
          <SettingRow 
            label="Income Categories" 
            href="/settings/categories?type=income" 
          />
          <SettingRow 
            label="Account Types" 
            href="/settings/account-types" 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
