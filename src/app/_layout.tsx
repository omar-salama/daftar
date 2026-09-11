import { mmkvPersister, queryClient } from '@/lib/queryClient';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { lightNavigationTheme, darkNavigationTheme } from '@/theme/navigationTheme';
import { useMaterializer } from '@/hooks/useMaterializer';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';

function MaterializerInitializer({ children }: { children: React.ReactNode }) {
  useMaterializer();
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? "light";

  return (
    <GestureHandlerRootView style={{ flex: 1 }} className={colorScheme === 'dark' ? 'dark' : ''}>
      <ThemeProvider value={colorScheme === 'dark' ? darkNavigationTheme : lightNavigationTheme}>
        <StatusBar style="auto" animated />
        <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: mmkvPersister }}>
          <MaterializerInitializer>
            <Stack screenOptions={{ headerShown: false }} >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="account-form" options={{ presentation: 'modal' }} />
              <Stack.Screen name="category-form" />
              <Stack.Screen name="entry" options={{ presentation: 'modal' }} />
            </Stack>
          </MaterializerInitializer>
        </PersistQueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
