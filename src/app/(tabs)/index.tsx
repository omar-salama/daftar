import { LedgerList } from '@/features/ledger/ui/LedgerList';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, useColorScheme, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LedgerTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 bg-surface">
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <LedgerList />
      </SafeAreaView>
      <Pressable
        className="absolute right-8"
        style={{ bottom: (insets.bottom || 12) + 12 }}
        onPress={() => router.push('/entry')}
      >
        <GlassView
          isInteractive
          style={[
            { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
            Platform.OS !== 'ios' && { backgroundColor: isDark ? '#adc6ff' : '#0058be' }
          ]}
        >
          {Platform.OS === 'ios' ? (
            <SymbolView
              name="plus"
              size={24}
            />
          ) : (
            <Ionicons
              name="add"
              size={30}
              color={isDark ? '#002e6a' : '#ffffff'}
            />
          )}
        </GlassView>
      </Pressable>
    </View>
  );
}
