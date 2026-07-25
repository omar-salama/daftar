import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          borderTopColor: isDark ? '#18181b' : '#e4e4e7',
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: isDark ? '#f4f4f5' : '#09090b',
        tabBarInactiveTintColor: isDark ? '#a1a1aa' : '#52525b',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Ledger', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="entry" options={{ title: 'Entry', tabBarIcon: () => <></> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: () => <></> }} />
    </Tabs>
  );
}
