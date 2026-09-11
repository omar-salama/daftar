import { AppHeader } from '@/components/ui/AppHeader';
import { useMainCurrency, useSetMainCurrency } from '@/features/settings/hooks/useSettings';
import { SUPPORTED_CURRENCIES } from '@/kernel/money';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MainCurrencyScreen() {
  const router = useRouter();
  const { data: mainCurrency = 'EGP' } = useMainCurrency();
  const updateCurrency = useSetMainCurrency();

  const handleSelectCurrency = (code: string) => {
    updateCurrency.mutate(code);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppHeader title="Main Currency" />
      
      <ScrollView className="flex-1 p-4">
        <View className="mb-6 bg-surface-container p-4 rounded-xl border border-surface-variant">
          <Text className="text-on-surface-variant text-sm leading-5">
            Changing your main currency updates your dashboard and global reports to reflect the new currency. 
            Your actual account balances and historical transaction amounts will remain exactly the same and won't be affected.
          </Text>
        </View>

        <View className="gap-2 pb-8">
          {Object.keys(SUPPORTED_CURRENCIES).map(code => (
            <Pressable
              key={code}
              className={`p-4 rounded-xl border flex-row justify-between items-center ${mainCurrency === code ? 'bg-primary-container border-primary' : 'bg-surface border-surface-variant'}`}
              onPress={() => handleSelectCurrency(code)}
            >
              <Text className={`text-lg font-medium ${mainCurrency === code ? 'text-on-primary-container' : 'text-on-surface'}`}>
                {code} - {SUPPORTED_CURRENCIES[code].symbol}
              </Text>
              {mainCurrency === code && (
                <Text className="text-primary font-bold text-lg">✓</Text>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
