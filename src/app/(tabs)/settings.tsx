import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsTab() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1 p-4">
        <Text className="text-3xl font-bold text-foreground mb-6">Settings</Text>
        
        <View className="bg-surface-elevated rounded-2xl overflow-hidden border border-border">
          <Link href="/settings/categories?type=expense" asChild>
            <Pressable className="p-4 border-b border-border active:bg-surface-hover flex-row items-center justify-between">
              <Text className="text-foreground text-lg">Expense Categories</Text>
              <Text className="text-foreground-secondary text-lg">›</Text>
            </Pressable>
          </Link>
          <Link href="/settings/categories?type=income" asChild>
            <Pressable className="p-4 active:bg-surface-hover flex-row items-center justify-between">
              <Text className="text-foreground text-lg">Income Categories</Text>
              <Text className="text-foreground-secondary text-lg">›</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
