import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1 p-4">
        <Text className="text-3xl font-bold text-on-surface mb-6">Settings</Text>
        
        <View className="bg-surface-container rounded-2xl overflow-hidden border border-surface-variant">
          <Link href="/settings/categories?type=expense" asChild>
            <Pressable className="p-4 border-b border-surface-variant active:bg-surface-container-high flex-row items-center justify-between">
              <Text className="text-on-surface text-lg">Expense Categories</Text>
              <Text className="text-on-surface-variant text-lg">›</Text>
            </Pressable>
          </Link>
          <Link href="/settings/categories?type=income" asChild>
            <Pressable className="p-4 active:bg-surface-container-high flex-row items-center justify-between">
              <Text className="text-on-surface text-lg">Income Categories</Text>
              <Text className="text-on-surface-variant text-lg">›</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
