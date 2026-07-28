import { mmkvPersister, queryClient } from '@/lib/queryClient';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: mmkvPersister }}>
        <StatusBar style="auto" />
        <Stack 
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colorScheme === 'dark' ? '#10131a' : '#ffffff' }
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="account-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="category-form" />
        </Stack>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
